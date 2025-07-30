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
        this.props.content.url?.value,
      ),
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
      const profile = await this.profileService.getProfile(
        event.curatorId.value,
      );
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
      (event: CardAddedToLibraryEvent) =>
        this.cardAddedToLibraryHandler.handle(event),
      CardAddedToLibraryEvent.name,
    );

    DomainEvents.register(
      (event: CollectionCreatedEvent) =>
        this.collectionCreatedHandler.handle(event),
      CollectionCreatedEvent.name,
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
  async execute(
    request: AddUrlToLibraryDTO,
  ): Promise<Result<AddUrlToLibraryResponseDTO>> {
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
  static create(
    configService: EnvironmentConfigService,
    repositories: Repositories,
  ): Services {
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

  const event = new CardAddedToLibraryEvent(
    cardId,
    curatorId,
    CardTypeEnum.URL,
    'https://example.com',
  );

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

## useful context

```
docs/event-system-architecture.md
docs/features/GUIDE.md
src/modules/cards/application/useCases/commands/AddUrlToLibraryUseCase.ts
src/modules/cards/domain/Card.ts
src/modules/cards/domain/events/CardAddedToLibraryEvent.ts
src/modules/cards/infrastructure/http/controllers/AddUrlToLibraryController.ts
src/modules/feeds/application/eventHandlers/CardAddedToLibraryEventHandler.ts
src/modules/feeds/application/ports/IFeedService.ts
src/modules/notifications/application/eventHandlers/CardAddedToLibraryEventHandler.ts
src/modules/notifications/application/ports/INotificationService.ts
src/shared/domain/AggregateRoot.ts
src/shared/domain/events/DomainEvents.ts
src/shared/domain/events/IDomainEvent.ts
src/shared/infrastructure/events/EventHandlerRegistry.ts
```
