# Domain Event Abstractions in a Distributed System

This document explains how implementing a distributed event system with BullMQ and Redis affects your core domain abstractions, and how to maintain clean architecture principles while scaling across multiple Fly.io instances.

## Overview

Your current domain event system follows clean DDD principles with clear separation of concerns. When moving to a distributed system, the **core domain abstractions remain unchanged** - we only extend the infrastructure layer to support distributed processing.

## Core Principle: Domain Stays Pure

The most important principle is that **your domain layer should not know about BullMQ, Redis, or any distributed infrastructure**. The domain continues to:

1. Raise events through `AggregateRoot.addDomainEvent()`
2. Use the same `IDomainEvent` interface
3. Maintain the same event classes (e.g., `CardAddedToLibraryEvent`)
4. Follow the same aggregate lifecycle

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Domain Layer                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Aggregates    │  │  Domain Events  │  │ Event Types  │ │
│  │                 │  │                 │  │              │ │
│  │ Card.addToLib() │  │  IDomainEvent   │  │ CardAdded... │ │
│  │ ↓ addDomainEvent│  │                 │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                Application Layer                            │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Event Handlers │  │   Use Cases     │                  │
│  │                 │  │                 │                  │
│  │ NotificationH.. │  │ AddCardToLib... │                  │
│  │ FeedHandler...  │  │                 │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│              Infrastructure Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ DomainEvents    │  │ EventRegistry   │  │ BullMQ Pub   │ │
│  │ (unchanged)     │  │ (extended)      │  │ (new)        │ │
│  │                 │  │                 │  │              │ │
│  │ Static dispatch │  │ Local + Remote  │  │ Redis Queue  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## What Stays the Same

### 1. Domain Events Interface

Your `IDomainEvent` interface remains unchanged:

```typescript
// src/shared/domain/events/IDomainEvent.ts - NO CHANGES
export interface IDomainEvent {
  dateTimeOccurred: Date;
  getAggregateId(): UniqueEntityID;
}
```

### 2. Event Classes

Your event classes remain pure domain objects:

```typescript
// src/modules/cards/domain/events/CardAddedToLibraryEvent.ts - NO CHANGES
export class CardAddedToLibraryEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;

  constructor(
    public readonly cardId: CardId,
    public readonly curatorId: CuratorId,
    public readonly cardType: CardTypeEnum,
    public readonly url?: string,
    public readonly title?: string,
  ) {
    this.dateTimeOccurred = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.cardId.getValue();
  }
}
```

### 3. Aggregate Root

Your `AggregateRoot` continues to work exactly the same:

```typescript
// src/shared/domain/AggregateRoot.ts - NO CHANGES
export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: IDomainEvent[] = [];

  protected addDomainEvent(domainEvent: IDomainEvent): void {
    this._domainEvents.push(domainEvent);
    DomainEvents.markAggregateForDispatch(this);
    this.logDomainEventAdded(domainEvent);
  }

  // ... rest unchanged
}
```

### 4. Domain Logic

Your domain logic remains pure:

```typescript
// src/modules/cards/domain/Card.ts - Domain logic unchanged
public addToLibrary(userId: CuratorId): Result<void, CardValidationError> {
  // ... validation logic

  this.props.libraryMemberships.push({
    curatorId: userId,
    addedAt: new Date(),
  });

  // This stays exactly the same - domain doesn't know about distribution
  this.addDomainEvent(
    new CardAddedToLibraryEvent(
      this.cardId,
      userId,
      this.props.type.value,
      this.props.url?.value,
      this.getCardTitle(),
    ),
  );

  return ok(undefined);
}
```

## What Changes: Infrastructure Extensions

### 1. Enhanced Event Handler Registry

The registry is extended to support both local and distributed processing:

```typescript
// src/shared/infrastructure/events/DistributedEventHandlerRegistry.ts
import { EventHandlerRegistry } from './EventHandlerRegistry';
import { DomainEvents } from '../../domain/events/DomainEvents';
import { CardAddedToLibraryEvent } from '../../../modules/cards/domain/events/CardAddedToLibraryEvent';
import { BullMQEventPublisher } from './BullMQEventPublisher';

export class DistributedEventHandlerRegistry extends EventHandlerRegistry {
  constructor(
    feedsCardAddedToLibraryHandler: any,
    notificationsCardAddedToLibraryHandler: any,
    private eventPublisher: BullMQEventPublisher,
  ) {
    super(feedsCardAddedToLibraryHandler, notificationsCardAddedToLibraryHandler);
  }

  registerAllHandlers(): void {
    // Keep existing local handlers for immediate consistency
    super.registerAllHandlers();

    // Add distributed publishing for cross-instance processing
    DomainEvents.register(
      async (event: CardAddedToLibraryEvent) => {
        try {
          await this.eventPublisher.publish(event);
        } catch (error) {
          console.error('Error publishing event to BullMQ:', error);
          // Don't fail the main operation if event publishing fails
        }
      },
      CardAddedToLibraryEvent.name,
    );
  }
}
```

### 2. Event Publisher (New Infrastructure)

This is a new infrastructure component that translates domain events to queue messages:

```typescript
// src/shared/infrastructure/events/BullMQEventPublisher.ts
import { Queue, ConnectionOptions } from 'bullmq';
import { IDomainEvent } from '../../domain/events/IDomainEvent';

export class BullMQEventPublisher {
  private queues: Map<string, Queue> = new Map();

  constructor(private redisConnection: ConnectionOptions) {}

  async publish(event: IDomainEvent): Promise<void> {
    const queueConfig = this.getQueueConfig(event);
    
    if (!this.queues.has(queueConfig.name)) {
      this.queues.set(queueConfig.name, new Queue(queueConfig.name, {
        connection: this.redisConnection,
        defaultJobOptions: queueConfig.options,
      }));
    }

    const queue = this.queues.get(queueConfig.name)!;
    
    // Serialize domain event for queue
    await queue.add(event.constructor.name, {
      ...this.serializeEvent(event),
      eventType: event.constructor.name,
      aggregateId: event.getAggregateId().toString(),
      dateTimeOccurred: event.dateTimeOccurred.toISOString(),
    });
  }

  private serializeEvent(event: IDomainEvent): any {
    // Convert domain event to serializable format
    return {
      ...event,
      // Handle value objects serialization
      cardId: event.cardId?.getValue?.()?.toString(),
      curatorId: event.curatorId?.value,
    };
  }
}
```

### 3. Event Workers (New Infrastructure)

Workers reconstruct domain events and dispatch to existing handlers:

```typescript
// src/shared/infrastructure/events/BullMQEventWorker.ts
import { Worker, Job } from 'bullmq';
import { CardAddedToLibraryEvent } from '../../../modules/cards/domain/events/CardAddedToLibraryEvent';
import { CardId } from '../../../modules/cards/domain/value-objects/CardId';
import { CuratorId } from '../../../modules/cards/domain/value-objects/CuratorId';

export class BullMQEventWorker {
  constructor(
    private redisConnection: ConnectionOptions,
    private notificationHandler: any,
    private feedHandler: any,
  ) {}

  async startWorkers(): Promise<void> {
    const worker = new Worker(
      'notifications',
      async (job: Job) => {
        // Reconstruct domain event from serialized data
        const event = this.reconstructEvent(job.data);
        
        // Use existing application layer handlers
        if (event instanceof CardAddedToLibraryEvent) {
          await this.notificationHandler.handle(event);
        }
      },
      { connection: this.redisConnection }
    );
  }

  private reconstructEvent(eventData: any): IDomainEvent {
    if (eventData.eventType === 'CardAddedToLibraryEvent') {
      // Reconstruct value objects
      const cardId = CardId.create(eventData.cardId).unwrap();
      const curatorId = CuratorId.create(eventData.curatorId).unwrap();
      
      const event = new CardAddedToLibraryEvent(
        cardId,
        curatorId,
        eventData.cardType,
        eventData.url,
        eventData.title
      );
      
      // Restore original timestamp
      (event as any).dateTimeOccurred = new Date(eventData.dateTimeOccurred);
      
      return event;
    }

    throw new Error(`Unknown event type: ${eventData.eventType}`);
  }
}
```

## Event Processing Patterns

### 1. Dual Processing (Recommended)

Process events both locally and distributed for optimal consistency:

```typescript
registerAllHandlers(): void {
  // Local processing for immediate consistency
  DomainEvents.register(
    (event: CardAddedToLibraryEvent) => 
      this.feedsHandler.handle(event), // Immediate
    CardAddedToLibraryEvent.name,
  );

  // Distributed processing for cross-instance features
  DomainEvents.register(
    async (event: CardAddedToLibraryEvent) => 
      await this.eventPublisher.publish(event), // Queued
    CardAddedToLibraryEvent.name,
  );
}
```

### 2. Event Sourcing Compatibility

The distributed system is compatible with event sourcing if you add it later:

```typescript
// Future: Event store integration
DomainEvents.register(
  async (event: CardAddedToLibraryEvent) => {
    // Store for audit/replay
    await this.eventStore.append(event);
    // Publish for processing
    await this.eventPublisher.publish(event);
  },
  CardAddedToLibraryEvent.name,
);
```

## Testing Strategy

### 1. Domain Tests (Unchanged)

Your domain tests continue to work without modification:

```typescript
describe('Card', () => {
  it('should raise CardAddedToLibraryEvent when added to library', () => {
    const card = Card.create(cardProps).unwrap();
    const userId = CuratorId.create('did:plc:user123').unwrap();

    card.addToLibrary(userId);

    expect(card.domainEvents).toHaveLength(1);
    expect(card.domainEvents[0]).toBeInstanceOf(CardAddedToLibraryEvent);
  });
});
```

### 2. Integration Tests (New)

Add tests for the distributed infrastructure:

```typescript
describe('DistributedEventHandlerRegistry', () => {
  it('should publish events to BullMQ and process locally', async () => {
    const mockPublisher = { publish: jest.fn() };
    const registry = new DistributedEventHandlerRegistry(
      feedsHandler,
      notificationsHandler,
      mockPublisher
    );

    registry.registerAllHandlers();
    
    const event = new CardAddedToLibraryEvent(cardId, userId, CardTypeEnum.URL);
    DomainEvents.dispatch(event);

    expect(mockPublisher.publish).toHaveBeenCalledWith(event);
  });
});
```

## Migration Strategy

### Phase 1: Add Infrastructure (No Domain Changes)
1. Install BullMQ dependencies
2. Create `BullMQEventPublisher`
3. Create `DistributedEventHandlerRegistry`
4. Deploy with Redis

### Phase 2: Switch Registry (No Domain Changes)
1. Update `ServiceFactory` to use `DistributedEventHandlerRegistry`
2. Deploy workers
3. Monitor dual processing

### Phase 3: Optimize (No Domain Changes)
1. Fine-tune queue configurations
2. Add monitoring and metrics
3. Scale workers based on load

## Key Benefits of This Approach

### 1. **Domain Purity Maintained**
- No distributed system concerns leak into domain
- Easy to test domain logic in isolation
- Can switch infrastructure without domain changes

### 2. **Gradual Migration**
- Can deploy distributed system alongside existing local processing
- Rollback is simple (just switch registry back)
- No big-bang deployment required

### 3. **Operational Flexibility**
- Can process some events locally, others distributed
- Can add event sourcing later without domain changes
- Can switch from BullMQ to other systems if needed

### 4. **Performance Options**
- Immediate local processing for critical paths
- Distributed processing for cross-instance features
- Can optimize each processing path independently

## Conclusion

The distributed event system is purely an infrastructure concern. Your domain model remains clean and focused on business logic, while the infrastructure layer handles the complexity of distributed processing. This maintains the core DDD principle of keeping the domain pure while enabling the scalability you need for social features.

The key insight is that **events are still events** - whether they're processed in-memory or through a distributed queue doesn't change their fundamental nature or the domain logic that creates them.
