# Event System Architecture Overview

This document explains how our event-driven architecture works across different deployment contexts, with a focus on the CardAddedToLibrary event flow.

## System Components

### Core Components

1. **Event Publishers** - Publish domain events to the event system
2. **Event Subscribers** - Subscribe to and handle domain events
3. **Event Handlers** - Process specific event types
4. **Sagas** - Coordinate complex business processes across events
5. **State Stores** - Persist saga state for coordination

### Implementation Variants

- **InMemory**: Events processed synchronously within the same process
- **BullMQ + Redis**: Events processed asynchronously via Redis queues

## Deployment Contexts

### 1. Production (Fly.io)

```
┌─────────────────┐    ┌─────────────────┐
│   Web Process   │    │ Feed Worker     │
│                 │    │   Process       │
│ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │AddUrlToLib  │ │    │ │EventHandler │ │
│ │UseCase      │ │    │ │             │ │
│ └─────────────┘ │    │ └─────────────┘ │
│        │        │    │        │        │
│        v        │    │        v        │
│ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │BullMQEvent  │ │    │ │CardCollection│ │
│ │Publisher    │ │    │ │Saga         │ │
│ └─────────────┘ │    │ └─────────────┘ │
│        │        │    │        │        │
└────────┼────────┘    └────────┼────────┘
         │                      │
         v                      v
    ┌─────────────────────────────────┐
    │           Redis                 │
    │  ┌─────────────────────────────┐│
    │  │     feeds Queue             ││
    │  │ ┌─────────────────────────┐ ││
    │  │ │CardAddedToLibraryEvent  │ ││
    │  │ └─────────────────────────┘ ││
    │  └─────────────────────────────┘│
    │  ┌─────────────────────────────┐│
    │  │     Saga State Store        ││
    │  │ ┌─────────────────────────┐ ││
    │  │ │ card-123-did:user:abc   │ ││
    │  │ │ {collections: [...]}    │ ││
    │  │ └─────────────────────────┘ ││
    │  └─────────────────────────────┘│
    └─────────────────────────────────┘
```

**Configuration:**
- `USE_IN_MEMORY_EVENTS=false` (default)
- `REDIS_URL` configured
- Multiple worker processes via `fly.toml`

### 2. Local Development

```
┌─────────────────────────────────────┐
│         Combined Process            │
│                                     │
│ ┌─────────────┐    ┌─────────────┐  │
│ │AddUrlToLib  │    │EventHandler │  │
│ │UseCase      │    │             │  │
│ └─────────────┘    └─────────────┘  │
│        │                  │         │
│        v                  v         │
│ ┌─────────────┐    ┌─────────────┐  │
│ │BullMQEvent  │    │CardCollection│  │
│ │Publisher    │    │Saga         │  │
│ └─────────────┘    └─────────────┘  │
│        │                  │         │
└────────┼──────────────────┼─────────┘
         │                  │
         v                  v
    ┌─────────────────────────────────┐
    │        Local Redis              │
    │  ┌─────────────────────────────┐│
    │  │     feeds Queue             ││
    │  └─────────────────────────────┘│
    │  ┌─────────────────────────────┐│
    │  │     Saga State Store        ││
    │  └─────────────────────────────┘│
    └─────────────────────────────────┘
```

**Configuration:**
- `USE_IN_MEMORY_EVENTS=false` (default)
- Local Redis via Docker
- Both web app and feed worker in same process

### 3. Local Mock Development

```
┌─────────────────────────────────────┐
│         Single Process              │
│                                     │
│ ┌─────────────┐    ┌─────────────┐  │
│ │AddUrlToLib  │    │EventHandler │  │
│ │UseCase      │    │             │  │
│ └─────────────┘    └─────────────┘  │
│        │                  │         │
│        v                  v         │
│ ┌─────────────┐    ┌─────────────┐  │
│ │InMemoryEvent│    │CardCollection│  │
│ │Publisher    │    │Saga         │  │
│ └─────────────┘    └─────────────┘  │
│        │                  │         │
│        └──────────────────┘         │
│                                     │
│     (No external dependencies)      │
└─────────────────────────────────────┘
```

**Configuration:**
- `USE_IN_MEMORY_EVENTS=true`
- No Redis required
- All processing in-memory

## Event Flow Example: CardAddedToLibrary

Let's trace what happens when a user adds a URL to their library:

### Step 1: Event Creation

```typescript
// In AddUrlToLibraryUseCase.ts
const addUrlCardToLibraryResult = 
  await this.cardLibraryService.addCardToLibrary(urlCard, curatorId);

// In CardLibraryService -> Card.addToLibrary()
const domainEvent = CardAddedToLibraryEvent.create(this.cardId, userId);
this.addDomainEvent(domainEvent.value);
```

### Step 2: Event Publishing

```typescript
// In AddUrlToLibraryUseCase.ts
const publishUrlCardResult = 
  await this.publishEventsForAggregate(urlCard);
```

This calls the configured `IEventPublisher`:

#### Production/Local Dev (BullMQ):
```typescript
// BullMQEventPublisher.publishEvents()
for (const event of events) {
  const targetQueues = this.getTargetQueues(event.eventName);
  // CardAddedToLibrary -> [feeds, search, analytics]
  for (const queueName of targetQueues) {
    await this.publishToQueue(queueName, event);
  }
}
```

#### Local Mock (InMemory):
```typescript
// InMemoryEventPublisher.publishEvents()
setImmediate(async () => {
  for (const handler of handlers) {
    await handler(event);
  }
});
```

### Step 3: Event Processing

#### Production (Multiple Workers):

```
Worker 1 (feeds queue):
┌─────────────────────────────────────┐
│ CardAddedToLibraryEventHandler      │
│           │                         │
│           v                         │
│ CardCollectionSaga.handleCardEvent  │
│           │                         │
│           v                         │
│ 1. Acquire distributed lock         │
│    key: "card-123-did:user:abc"     │
│ 2. Check existing saga state        │
│ 3. Merge/create pending activity    │
│ 4. Schedule flush after 3s          │
│ 5. Release lock                     │
└─────────────────────────────────────┘

Worker 2 (search queue):
┌─────────────────────────────────────┐
│ SearchIndexEventHandler             │
│ (processes same event for search)   │
└─────────────────────────────────────┘
```

#### Local Dev (Single Process):
Same as production but both web app and worker run in the same process.

#### Local Mock (In-Memory):
```
┌─────────────────────────────────────┐
│ InMemoryEventSubscriber             │
│           │                         │
│           v                         │
│ CardAddedToLibraryEventHandler      │
│           │                         │
│           v                         │
│ CardCollectionSaga.handleCardEvent  │
│ (uses in-memory state, no Redis)    │
└─────────────────────────────────────┘
```

### Step 4: Saga Coordination

The `CardCollectionSaga` handles event aggregation:

```typescript
// 1. Create aggregation key
const aggregationKey = `${cardId}-${actorId}`;

// 2. Acquire distributed lock (Redis) or in-memory lock
const lockAcquired = await this.acquireLock(aggregationKey);

// 3. Get/create pending activity
const existing = await this.getPendingActivity(aggregationKey);

// 4. Merge events within 3-second window
if (existing && this.isWithinWindow(existing)) {
  this.mergeActivity(existing, event);
} else {
  const newActivity = this.createNewPendingActivity(event);
  await this.scheduleFlush(aggregationKey);
}
```

### Step 5: Activity Creation

After the 3-second aggregation window:

```typescript
// CardCollectionSaga.flushActivity()
const request: AddCardCollectedActivityDTO = {
  type: ActivityTypeEnum.CARD_COLLECTED,
  actorId: pending.actorId,
  cardId: pending.cardId,
  collectionIds: pending.collectionIds.length > 0 
    ? pending.collectionIds 
    : undefined,
};

await this.addActivityToFeedUseCase.execute(request);
```

## Multi-Worker Coordination

### Redis-Based Distributed Locking

When multiple feed workers process events for the same card/user:

```
Time: T0
Worker 1: Receives CardAddedToLibraryEvent
Worker 2: Receives CardAddedToCollectionEvent (same card/user)

Time: T0+10ms
Worker 1: Acquires lock "saga:feed:lock:card-123-did:user:abc"
Worker 2: Attempts lock, fails, exits gracefully

Time: T0+50ms
Worker 1: Creates pending activity, schedules flush
Worker 1: Releases lock

Time: T0+100ms
Worker 2: Retries, acquires lock
Worker 2: Finds existing pending activity, merges collection info
Worker 2: Releases lock

Time: T0+3000ms
Worker 1: Flush timer fires, acquires lock
Worker 1: Creates single aggregated feed activity
Worker 1: Cleans up saga state
```

### State Store Keys

```
Pending Activity: "saga:feed:pending:card-123-did:user:abc"
Distributed Lock: "saga:feed:lock:card-123-did:user:abc"
```

## Queue Routing

Events are routed to multiple queues based on type:

```typescript
// BullMQEventPublisher.getTargetQueues()
switch (eventName) {
  case EventNames.CARD_ADDED_TO_LIBRARY:
    return [QueueNames.FEEDS, QueueNames.SEARCH, QueueNames.ANALYTICS];
  case EventNames.CARD_ADDED_TO_COLLECTION:
    return [QueueNames.FEEDS];
  default:
    return [QueueNames.FEEDS];
}
```

## Configuration Summary

| Context | Events | Redis | Workers | Saga State |
|---------|--------|-------|---------|------------|
| Production | BullMQ | Required | Multiple processes | Redis |
| Local Dev | BullMQ | Required | Single process | Redis |
| Local Mock | InMemory | Not required | Single process | In-memory |

## Environment Variables

```bash
# Event system type
USE_IN_MEMORY_EVENTS=true|false

# Redis configuration (required for BullMQ)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional

# Mock services (for local development)
USE_MOCK_REPOS=true|false
USE_FAKE_PUBLISHERS=true|false
USE_MOCK_AUTH=true|false
```

## Local Development Commands

The project provides different development commands for different contexts:

### `npm run dev` (Redis + BullMQ)
- Uses `scripts/dev-combined.sh`
- Starts PostgreSQL and Redis containers
- Runs web app and separate feed worker processes
- Uses BullMQ for event processing
- Best for testing production-like behavior locally

### `npm run dev:mock` (In-Memory)
- Sets `USE_IN_MEMORY_EVENTS=true` and other mock flags
- Uses `dev:app:inner` directly (bypasses `dev-combined.sh`)
- No external dependencies (no Redis/containers)
- Single process with in-memory event processing
- Best for rapid development and testing

### `npm run dev:mock:pub:auth` (Hybrid)
- Uses real repositories but fake publishers and auth
- Still requires PostgreSQL and Redis
- Good for testing repository layer with simplified external services
