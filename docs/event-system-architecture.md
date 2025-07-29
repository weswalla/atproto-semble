# Event System Architecture

This document outlines the event system architecture for our DDD-based application, building on the existing `AggregateRoot` and `DomainEvents` abstractions.

## Overview

Our event system follows Domain-Driven Design principles where domain events represent meaningful business occurrences that domain experts care about. Events are raised by aggregate roots when their state changes in significant ways.

## Core Abstractions (Already Implemented)

### IDomainEvent Interface
```typescript
export interface IDomainEvent {
  dateTimeOccurred: Date;
  getAggregateId(): UniqueEntityID;
}
```

### AggregateRoot Base Class
- Maintains a list of domain events (`_domainEvents`)
- Provides `addDomainEvent()` method to raise events
- Automatically marks aggregate for dispatch via `DomainEvents.markAggregateForDispatch()`
- Provides `clearEvents()` to clear events after dispatch

### DomainEvents Static Class
- Manages event handlers registration
- Tracks aggregates that have raised events
- Dispatches events when `dispatchEventsForAggregate()` is called
- Provides handler registration via `register(callback, eventClassName)`

## Event System Architecture Layers

### 1. Domain Layer - Event Definitions

**Location**: `src/modules/{module}/domain/events/`

Domain events should be defined as classes that implement `IDomainEvent`. They represent pure business concepts.

```typescript
// Example: CardAddedToLibraryEvent
export class CardAddedToLibraryEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  
  constructor(
    public readonly cardId: CardId,
    public readonly curatorId: CuratorId,
    public readonly cardType: CardTypeEnum,
    public readonly url?: string,
  ) {
    this.dateTimeOccurred = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.cardId.getValue();
  }
}
```

**Event Naming Conventions**:
- Use past tense: `CardAddedToLibraryEvent`, `CollectionCreatedEvent`
- Be specific about the business action: `UrlCardAddedToLibraryEvent` vs generic `CardUpdatedEvent`
- Include relevant context data needed by event handlers

### 2. Domain Layer - Raising Events in Aggregates

Events should be raised within aggregate methods when business-significant state changes occur:

```typescript
// In Card aggregate
export class Card extends AggregateRoot<CardProps> {
  
  public addToLibrary(curatorId: CuratorId): Result<void> {
    // Business logic validation
    if (this.isInLibrary(curatorId)) {
      return err(new Error('Card already in library'));
    }

    // Apply state change
    this.props.libraries.push(curatorId);

    // Raise domain event
    this.addDomainEvent(
      new CardAddedToLibraryEvent(
        this.cardId,
        curatorId,
        this.props.type.value,
        this.props.content.url?.value
      )
    );

    return ok();
  }
}
```

**When to Raise Events**:
- After successful state changes, not before
- For business-significant actions that other bounded contexts care about
- When side effects or integrations need to be triggered
- For audit trails and business intelligence

### 3. Application Layer - Event Handlers

**Location**: `src/modules/{module}/application/eventHandlers/`

Event handlers contain application logic that should happen in response to domain events. They coordinate between different services and bounded contexts.

```typescript
// Example: CardAddedToLibraryEventHandler
export class CardAddedToLibraryEventHandler {
  constructor(
    private profileService: IProfileService,
    private notificationService: INotificationService,
    private analyticsService: IAnalyticsService,
  ) {}

  async handle(event: CardAddedToLibraryEvent): Promise<void> {
    try {
      // Update user activity metrics
      await this.analyticsService.trackCardAddedToLibrary({
        cardId: event.cardId.getStringValue(),
        curatorId: event.curatorId.value,
        cardType: event.cardType,
        timestamp: event.dateTimeOccurred,
      });

      // Send notification to followers (if public library)
      const profile = await this.profileService.getProfile(event.curatorId.value);
      if (profile.isSuccess() && profile.value.isPublic) {
        await this.notificationService.notifyFollowers({
          userId: event.curatorId.value,
          action: 'added_card_to_library',
          cardId: event.cardId.getStringValue(),
        });
      }

      // Trigger content indexing for search
      if (event.url) {
        await this.searchIndexService.indexCard({
          cardId: event.cardId.getStringValue(),
          url: event.url,
          curatorId: event.curatorId.value,
        });
      }
    } catch (error) {
      // Log error but don't fail the main operation
      console.error('Error handling CardAddedToLibraryEvent:', error);
    }
  }
}
```

**Event Handler Principles**:
- Handlers should be idempotent (safe to run multiple times)
- Failures in handlers should not fail the main business operation
- Handlers can coordinate multiple services but shouldn't contain business logic
- Use dependency injection for testability

### 4. Infrastructure Layer - Event Handler Registration

**Location**: `src/shared/infrastructure/events/`

Create an event handler registry that wires up domain events to their handlers:

```typescript
// EventHandlerRegistry
export class EventHandlerRegistry {
  constructor(
    private cardAddedToLibraryHandler: CardAddedToLibraryEventHandler,
    private collectionCreatedHandler: CollectionCreatedEventHandler,
    // ... other handlers
  ) {}

  registerAllHandlers(): void {
    // Register card events
    DomainEvents.register(
      (event: CardAddedToLibraryEvent) => this.cardAddedToLibraryHandler.handle(event),
      CardAddedToLibraryEvent.name
    );

    DomainEvents.register(
      (event: CollectionCreatedEvent) => this.collectionCreatedHandler.handle(event),
      CollectionCreatedEvent.name
    );

    // ... register other event handlers
  }

  clearAllHandlers(): void {
    DomainEvents.clearHandlers();
  }
}
```

### 5. Infrastructure Layer - Event Dispatch Integration

Events should be dispatched at the end of successful use case executions, typically in a repository save operation or use case completion:

```typescript
// In repository implementation
export class DrizzleCardRepository implements ICardRepository {
  async save(card: Card): Promise<Result<void>> {
    try {
      // Save to database
      await this.db.insert(cards).values(this.toPersistence(card));
      
      // Dispatch events after successful save
      DomainEvents.dispatchEventsForAggregate(card.id);
      
      return ok();
    } catch (error) {
      return err(error);
    }
  }
}
```

**Alternative**: Dispatch in use case after repository operations:

```typescript
// In use case
export class AddUrlToLibraryUseCase {
  async execute(request: AddUrlToLibraryDTO): Promise<Result<AddUrlToLibraryResponseDTO>> {
    try {
      // ... business logic
      
      const saveResult = await this.cardRepository.save(urlCard);
      if (saveResult.isErr()) {
        return err(saveResult.error);
      }

      // Dispatch events after successful persistence
      DomainEvents.dispatchEventsForAggregate(urlCard.id);
      
      return ok(response);
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }
}
```

## Event System Integration Points

### Factory Registration

Event handlers need to be registered in the factory system:

```typescript
// In ServiceFactory
export class ServiceFactory {
  static create(configService: EnvironmentConfigService, repositories: Repositories): Services {
    // ... existing services
    
    // Event handlers
    const cardAddedToLibraryHandler = new CardAddedToLibraryEventHandler(
      profileService,
      notificationService,
      analyticsService,
    );
    
    const eventHandlerRegistry = new EventHandlerRegistry(
      cardAddedToLibraryHandler,
      // ... other handlers
    );
    
    // Register all event handlers
    eventHandlerRegistry.registerAllHandlers();
    
    return {
      // ... existing services
      eventHandlerRegistry,
    };
  }
}
```

### Testing Considerations

For testing, you'll want to:

1. **Clear events between tests**:
```typescript
afterEach(() => {
  DomainEvents.clearHandlers();
  DomainEvents.clearMarkedAggregates();
});
```

2. **Test event raising**:
```typescript
it('should raise CardAddedToLibraryEvent when card is added to library', () => {
  const card = CardFactory.create(cardInput);
  const curatorId = CuratorId.create('did:plc:test');
  
  card.addToLibrary(curatorId);
  
  expect(card.domainEvents).toHaveLength(1);
  expect(card.domainEvents[0]).toBeInstanceOf(CardAddedToLibraryEvent);
});
```

3. **Test event handlers in isolation**:
```typescript
it('should track analytics when card is added to library', async () => {
  const handler = new CardAddedToLibraryEventHandler(
    mockProfileService,
    mockNotificationService,
    mockAnalyticsService,
  );
  
  const event = new CardAddedToLibraryEvent(cardId, curatorId, CardTypeEnum.URL, 'https://example.com');
  
  await handler.handle(event);
  
  expect(mockAnalyticsService.trackCardAddedToLibrary).toHaveBeenCalledWith({
    cardId: cardId.getStringValue(),
    curatorId: curatorId.value,
    cardType: CardTypeEnum.URL,
    timestamp: event.dateTimeOccurred,
  });
});
```

## Event Design Guidelines

### Event Granularity
- **Too Fine**: `CardTitleChangedEvent`, `CardDescriptionChangedEvent` (unless specifically needed)
- **Too Coarse**: `CardUpdatedEvent` (not specific enough)
- **Just Right**: `CardAddedToLibraryEvent`, `CardRemovedFromCollectionEvent`

### Event Data
- Include the aggregate ID that raised the event
- Include enough context for handlers to do their work
- Don't include entire aggregate state (events should be lightweight)
- Include timestamp for ordering and auditing

### Event Naming
- Use past tense (events represent things that have happened)
- Be specific about the business action
- Include the aggregate type: `Card...Event`, `Collection...Event`

### Handler Design
- Keep handlers focused on a single responsibility
- Make handlers idempotent
- Don't let handler failures break the main business operation
- Use async/await for I/O operations
- Log errors appropriately

## Example Event Scenarios

### URL Card Added to Library
1. **Trigger**: `Card.addToLibrary()` method called
2. **Event**: `CardAddedToLibraryEvent` raised
3. **Handlers**:
   - Update user activity metrics
   - Notify followers
   - Index for search
   - Update recommendation engine

### Collection Created
1. **Trigger**: `Collection.create()` factory method
2. **Event**: `CollectionCreatedEvent` raised  
3. **Handlers**:
   - Send welcome notification
   - Update user profile stats
   - Trigger initial recommendations

### Card Removed from Library
1. **Trigger**: `Card.removeFromLibrary()` method
2. **Event**: `CardRemovedFromLibraryEvent` raised
3. **Handlers**:
   - Update analytics
   - Remove from search index
   - Clean up recommendations

## Fly.io Deployment Considerations

When deploying to Fly.io, you can extend the current in-memory event system to a distributed event system using several approaches:

### Option 1: Redis Pub/Sub

Redis provides a lightweight pub/sub mechanism perfect for distributed event handling:

```typescript
// Infrastructure layer - Redis Event Publisher
export class RedisEventPublisher {
  constructor(private redis: Redis) {}

  async publish(event: IDomainEvent): Promise<void> {
    const eventName = event.constructor.name;
    const eventData = {
      ...event,
      aggregateId: event.getAggregateId().toString(),
    };
    
    await this.redis.publish(`events:${eventName}`, JSON.stringify(eventData));
  }
}

// Infrastructure layer - Redis Event Subscriber
export class RedisEventSubscriber {
  constructor(
    private redis: Redis,
    private eventHandlerRegistry: EventHandlerRegistry,
  ) {}

  async subscribe(): Promise<void> {
    const subscriber = this.redis.duplicate();
    
    // Subscribe to all event patterns
    await subscriber.psubscribe('events:*');
    
    subscriber.on('pmessage', async (pattern, channel, message) => {
      try {
        const eventData = JSON.parse(message);
        const eventName = channel.replace('events:', '');
        
        // Reconstruct and handle the event
        await this.handleDistributedEvent(eventName, eventData);
      } catch (error) {
        console.error('Error handling distributed event:', error);
      }
    });
  }

  private async handleDistributedEvent(eventName: string, eventData: any): Promise<void> {
    // Reconstruct the event object and dispatch to local handlers
    // This requires event reconstruction logic based on event type
  }
}

// Update DomainEvents to support distributed publishing
export class DistributedDomainEvents extends DomainEvents {
  private static eventPublisher?: RedisEventPublisher;

  public static setEventPublisher(publisher: RedisEventPublisher): void {
    this.eventPublisher = publisher;
  }

  private static async dispatch(event: IDomainEvent): Promise<void> {
    // Local dispatch (existing logic)
    const eventClassName: string = event.constructor.name;
    if (Object.hasOwn(this.handlersMap, eventClassName)) {
      const handlers = this.handlersMap[eventClassName];
      if (handlers) {
        for (let handler of handlers) {
          await handler(event);
        }
      }
    }

    // Distributed dispatch
    if (this.eventPublisher) {
      await this.eventPublisher.publish(event);
    }
  }
}
```

**Fly.io Redis Setup:**
```toml
# fly.toml
[[services]]
  internal_port = 6379
  protocol = "tcp"

[env]
  REDIS_URL = "redis://localhost:6379"
```

### Option 2: NATS Messaging

NATS provides more advanced messaging patterns with better delivery guarantees:

```typescript
// Infrastructure layer - NATS Event Publisher
export class NatsEventPublisher {
  constructor(private nats: NatsConnection) {}

  async publish(event: IDomainEvent): Promise<void> {
    const subject = `events.${event.constructor.name}`;
    const eventData = {
      ...event,
      aggregateId: event.getAggregateId().toString(),
      timestamp: event.dateTimeOccurred.toISOString(),
    };

    await this.nats.publish(subject, JSON.stringify(eventData));
  }
}

// Infrastructure layer - NATS Event Subscriber
export class NatsEventSubscriber {
  constructor(
    private nats: NatsConnection,
    private eventHandlerRegistry: EventHandlerRegistry,
  ) {}

  async subscribe(): Promise<void> {
    // Subscribe to all event subjects
    const subscription = this.nats.subscribe('events.*');
    
    for await (const message of subscription) {
      try {
        const eventData = JSON.parse(message.data.toString());
        const eventType = message.subject.replace('events.', '');
        
        await this.handleDistributedEvent(eventType, eventData);
      } catch (error) {
        console.error('Error handling NATS event:', error);
      }
    }
  }

  private async handleDistributedEvent(eventType: string, eventData: any): Promise<void> {
    // Event reconstruction and local dispatch logic
  }
}
```

**Fly.io NATS Setup:**
```dockerfile
# Add to Dockerfile
RUN curl -L https://github.com/nats-io/nats-server/releases/download/v2.10.4/nats-server-v2.10.4-linux-amd64.zip -o nats-server.zip
RUN unzip nats-server.zip && mv nats-server-v2.10.4-linux-amd64/nats-server /usr/local/bin/
```

### Option 3: Database-Based Event Store

For simpler deployments, use your existing PostgreSQL database as an event store:

```typescript
// Domain layer - Event Store interfaces
export interface EventStoreRecord {
  id: string;
  aggregateId: string;
  eventType: string;
  eventData: string;
  version: number;
  timestamp: Date;
  processed: boolean;
}

export interface IEventStore {
  saveEvent(event: IDomainEvent, aggregateId: string): Promise<Result<void>>;
  getUnprocessedEvents(): Promise<Result<EventStoreRecord[]>>;
  markEventAsProcessed(eventId: string): Promise<Result<void>>;
}

// Infrastructure layer - Drizzle Event Store
export class DrizzleEventStore implements IEventStore {
  constructor(private db: PostgresJsDatabase) {}

  async saveEvent(event: IDomainEvent, aggregateId: string): Promise<Result<void>> {
    try {
      await this.db.insert(eventStore).values({
        id: uuid(),
        aggregateId,
        eventType: event.constructor.name,
        eventData: JSON.stringify(event),
        version: 1, // Implement versioning logic
        timestamp: event.dateTimeOccurred,
        processed: false,
      });
      
      return ok();
    } catch (error) {
      return err(error);
    }
  }

  async getUnprocessedEvents(): Promise<Result<EventStoreRecord[]>> {
    try {
      const events = await this.db
        .select()
        .from(eventStore)
        .where(eq(eventStore.processed, false))
        .orderBy(eventStore.timestamp);
        
      return ok(events);
    } catch (error) {
      return err(error);
    }
  }

  async markEventAsProcessed(eventId: string): Promise<Result<void>> {
    try {
      await this.db
        .update(eventStore)
        .set({ processed: true })
        .where(eq(eventStore.id, eventId));
        
      return ok();
    } catch (error) {
      return err(error);
    }
  }
}

// Infrastructure layer - Background Event Processor
export class BackgroundEventProcessor {
  constructor(
    private eventStore: IEventStore,
    private eventHandlerRegistry: EventHandlerRegistry,
  ) {}

  async start(): Promise<void> {
    // Process events every 5 seconds
    setInterval(async () => {
      await this.processEvents();
    }, 5000);
  }

  private async processEvents(): Promise<void> {
    try {
      const eventsResult = await this.eventStore.getUnprocessedEvents();
      if (eventsResult.isErr()) {
        console.error('Error fetching unprocessed events:', eventsResult.error);
        return;
      }

      for (const eventRecord of eventsResult.value) {
        try {
          // Reconstruct event object
          const eventData = JSON.parse(eventRecord.eventData);
          
          // Dispatch to local handlers
          await this.dispatchEvent(eventRecord.eventType, eventData);
          
          // Mark as processed
          await this.eventStore.markEventAsProcessed(eventRecord.id);
        } catch (error) {
          console.error(`Error processing event ${eventRecord.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in background event processor:', error);
    }
  }

  private async dispatchEvent(eventType: string, eventData: any): Promise<void> {
    // Event reconstruction and dispatch logic
  }
}
```

**Database Schema:**
```sql
-- Add to your migrations
CREATE TABLE event_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  event_data JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_store_unprocessed ON event_store (processed, timestamp) WHERE processed = FALSE;
CREATE INDEX idx_event_store_aggregate ON event_store (aggregate_id, version);
```

### Option 4: RabbitMQ with Reliable Delivery

For mission-critical events requiring guaranteed delivery:

```typescript
// Infrastructure layer - RabbitMQ Event Publisher
export class RabbitMQEventPublisher {
  constructor(private connection: amqp.Connection) {}

  async publish(event: IDomainEvent): Promise<void> {
    const channel = await this.connection.createChannel();
    const exchange = 'domain_events';
    const routingKey = event.constructor.name;
    
    await channel.assertExchange(exchange, 'topic', { durable: true });
    
    const eventData = Buffer.from(JSON.stringify({
      ...event,
      aggregateId: event.getAggregateId().toString(),
    }));

    await channel.publish(exchange, routingKey, eventData, {
      persistent: true, // Survive broker restarts
      timestamp: Date.now(),
    });
    
    await channel.close();
  }
}

// Infrastructure layer - RabbitMQ Event Consumer
export class RabbitMQEventConsumer {
  constructor(
    private connection: amqp.Connection,
    private eventHandlerRegistry: EventHandlerRegistry,
  ) {}

  async startConsuming(): Promise<void> {
    const channel = await this.connection.createChannel();
    const exchange = 'domain_events';
    const queue = `events_${process.env.FLY_APP_NAME || 'app'}`;
    
    await channel.assertExchange(exchange, 'topic', { durable: true });
    await channel.assertQueue(queue, { durable: true });
    
    // Bind to all event types
    await channel.bindQueue(queue, exchange, '*Event');
    
    await channel.consume(queue, async (message) => {
      if (message) {
        try {
          const eventData = JSON.parse(message.content.toString());
          const eventType = message.fields.routingKey;
          
          await this.handleDistributedEvent(eventType, eventData);
          
          // Acknowledge successful processing
          channel.ack(message);
        } catch (error) {
          console.error('Error processing RabbitMQ event:', error);
          // Reject and requeue for retry
          channel.nack(message, false, true);
        }
      }
    });
  }
}
```

### Integration with Existing System

To integrate distributed events with your current system:

```typescript
// Update EventHandlerRegistry for distributed events
export class DistributedEventHandlerRegistry extends EventHandlerRegistry {
  constructor(
    feedsCardAddedToLibraryHandler: FeedsCardAddedToLibraryEventHandler,
    notificationsCardAddedToLibraryHandler: NotificationsCardAddedToLibraryEventHandler,
    private eventPublisher?: RedisEventPublisher | NatsEventPublisher,
  ) {
    super(feedsCardAddedToLibraryHandler, notificationsCardAddedToLibraryHandler);
  }

  registerAllHandlers(): void {
    // Register local handlers (existing logic)
    super.registerAllHandlers();
    
    // If we have a distributed publisher, also publish events
    if (this.eventPublisher) {
      DomainEvents.register(
        async (event: CardAddedToLibraryEvent) => {
          await this.eventPublisher!.publish(event);
        },
        CardAddedToLibraryEvent.name,
      );
    }
  }
}
```

### Fly.io Deployment Configuration

**Multi-region with Redis:**
```toml
# fly.toml
[env]
  REDIS_URL = "redis://your-redis-app.internal:6379"

[[services]]
  internal_port = 8080
  protocol = "tcp"

[deploy]
  strategy = "rolling"
```

**Background worker process:**
```toml
# fly.toml for worker
[processes]
  web = "npm start"
  worker = "npm run worker"

[env]
  PROCESS_TYPE = "worker"
```

### Monitoring and Observability

```typescript
// Add metrics for distributed events
export class EventMetrics {
  private static eventCounts = new Map<string, number>();
  private static errorCounts = new Map<string, number>();

  static incrementEventCount(eventType: string): void {
    const current = this.eventCounts.get(eventType) || 0;
    this.eventCounts.set(eventType, current + 1);
  }

  static incrementErrorCount(eventType: string): void {
    const current = this.errorCounts.get(eventType) || 0;
    this.errorCounts.set(eventType, current + 1);
  }

  static getMetrics(): Record<string, any> {
    return {
      eventCounts: Object.fromEntries(this.eventCounts),
      errorCounts: Object.fromEntries(this.errorCounts),
    };
  }
}
```

## Future Considerations

### Event Sourcing
The current system could be extended to support event sourcing by:
- Persisting events to an event store
- Rebuilding aggregate state from events
- Supporting event replay and temporal queries

### Event Streaming
For high-volume scenarios, consider:
- Publishing events to message queues (Redis, RabbitMQ)
- Event streaming platforms (Kafka)
- Eventual consistency patterns

### Cross-Bounded Context Events
For events that cross module boundaries:
- Define integration events at the application layer
- Use event translation between bounded contexts
- Consider event versioning strategies

## Implementation Checklist

When implementing a new domain event:

### Domain Layer
- [ ] Define event class implementing `IDomainEvent`
- [ ] Add event raising logic to appropriate aggregate methods
- [ ] Include necessary context data in event

### Application Layer  
- [ ] Create event handler class
- [ ] Implement handler logic coordinating services
- [ ] Handle errors gracefully

### Infrastructure Layer
- [ ] Register handler in `EventHandlerRegistry`
- [ ] Ensure event dispatch happens after persistence
- [ ] Add factory registration

### Testing
- [ ] Test event is raised by aggregate
- [ ] Test handler logic in isolation
- [ ] Test end-to-end event flow
- [ ] Clear events between tests

## Recommended Fly.io Setup

For most applications, we recommend starting with the **Database-Based Event Store** approach because:

1. **Simplicity**: Uses your existing PostgreSQL database
2. **Reliability**: ACID transactions ensure event consistency
3. **No Additional Infrastructure**: No need for separate message brokers
4. **Easy Debugging**: Events are visible in your database
5. **Cost Effective**: No additional services to run

As your application scales, you can migrate to Redis Pub/Sub or NATS for better performance and more advanced messaging patterns.

**Migration Path:**
1. Start with database-based events
2. Add Redis Pub/Sub for real-time features
3. Migrate to NATS or RabbitMQ for complex routing and guaranteed delivery
4. Consider event sourcing for audit requirements

This architecture provides a solid foundation for implementing domain events while maintaining clean separation of concerns and testability, with clear paths for scaling on Fly.io infrastructure.
