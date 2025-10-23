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
│ ┌─────────────────────────────────┐ │
│ │    InMemorySagaStateStore       │ │
│ │  - Map-based state storage      │ │
│ │  - Timeout-based lock expiry    │ │
│ │  - No external dependencies     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Configuration:**
- `USE_IN_MEMORY_EVENTS=true`
- No Redis required
- All processing in-memory with `InMemorySagaStateStore`
- Uses `InMemoryEventWorkerProcess` for event handling

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

### Scaling Feed Workers

When you scale feed workers horizontally (multiple instances processing the feeds queue), the saga coordination becomes critical to prevent duplicate activities and ensure proper event aggregation.

#### Worker Scaling Scenarios

**Single Feed Worker:**
```
┌─────────────────┐
│  Feed Worker 1  │
│                 │
│ ┌─────────────┐ │
│ │CardCollection│ │
│ │Saga         │ │
│ └─────────────┘ │
└─────────────────┘
         │
         v
    ┌─────────────┐
    │    Redis    │
    │ Queue+State │
    └─────────────┘
```

**Multiple Feed Workers (Production Scale):**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Feed Worker 1  │    │  Feed Worker 2  │    │  Feed Worker 3  │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │CardCollection│ │    │ │CardCollection│ │    │ │CardCollection│ │
│ │Saga         │ │    │ │Saga         │ │    │ │Saga         │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 v
                        ┌─────────────────┐
                        │      Redis      │
                        │ ┌─────────────┐ │
                        │ │feeds Queue  │ │
                        │ │- Event A    │ │
                        │ │- Event B    │ │
                        │ │- Event C    │ │
                        │ └─────────────┘ │
                        │ ┌─────────────┐ │
                        │ │Saga State   │ │
                        │ │+ Locks      │ │
                        │ └─────────────┘ │
                        └─────────────────┘
```

### Redis-Based Distributed Locking

The saga uses Redis-based distributed locking to coordinate between multiple workers processing events for the same card/user combination:

#### Lock Acquisition Strategy

```typescript
// CardCollectionSaga.acquireLock()
const lockKey = `saga:feed:lock:${cardId}-${actorId}`;
const lockTtl = 13; // seconds (aggregation window + buffer)
const result = await redis.set(lockKey, '1', 'EX', lockTtl, 'NX');
return result === 'OK'; // true if lock acquired, false if already held
```

#### Detailed Multi-Worker Flow

**Scenario: 3 workers, same card/user events arrive simultaneously**

```
Time: T0 (Events arrive in queue)
┌─────────────────────────────────────────────────────────────┐
│ Redis feeds Queue:                                          │
│ - CardAddedToLibraryEvent (card-123, user-abc)             │
│ - CardAddedToCollectionEvent (card-123, user-abc, coll-1)  │
│ - CardAddedToCollectionEvent (card-123, user-abc, coll-2)  │
└─────────────────────────────────────────────────────────────┘

Time: T0+5ms (Workers pick up events)
Worker 1: Gets CardAddedToLibraryEvent
Worker 2: Gets CardAddedToCollectionEvent (coll-1)  
Worker 3: Gets CardAddedToCollectionEvent (coll-2)

Time: T0+10ms (Lock competition)
Worker 1: SET saga:feed:lock:card-123-user-abc 1 EX 13 NX → OK ✓
Worker 2: SET saga:feed:lock:card-123-user-abc 1 EX 13 NX → null ✗
Worker 3: SET saga:feed:lock:card-123-user-abc 1 EX 13 NX → null ✗

Time: T0+15ms (Lock holder processes)
Worker 1: 
  - Creates new pending activity
  - Sets hasLibraryEvent = true
  - Schedules flush in 3000ms
  - Releases lock: DEL saga:feed:lock:card-123-user-abc

Worker 2 & 3: Exit gracefully (lock acquisition failed)

Time: T0+20ms (Workers retry - BullMQ automatic retry)
Worker 2: SET saga:feed:lock:card-123-user-abc 1 EX 13 NX → OK ✓
Worker 3: SET saga:feed:lock:card-123-user-abc 1 EX 13 NX → null ✗

Time: T0+25ms (Second lock holder processes)
Worker 2:
  - Finds existing pending activity
  - Merges: adds coll-1 to collectionIds
  - Sets hasCollectionEvents = true
  - Releases lock

Time: T0+30ms (Third worker gets chance)
Worker 3: SET saga:feed:lock:card-123-user-abc 1 EX 13 NX → OK ✓
Worker 3:
  - Finds existing pending activity  
  - Merges: adds coll-2 to collectionIds
  - Releases lock

Time: T0+3000ms (Flush timer fires)
Worker 1's timer: 
  - Acquires lock again
  - Creates single aggregated activity:
    {
      cardId: "card-123",
      actorId: "user-abc", 
      collectionIds: ["coll-1", "coll-2"],
      hasLibraryEvent: true,
      hasCollectionEvents: true
    }
  - Calls AddActivityToFeedUseCase
  - Cleans up saga state
  - Releases lock
```

#### Race Condition Prevention

**Problem Without Locking:**
```
Worker 1: Reads pending state → null
Worker 2: Reads pending state → null  
Worker 1: Creates activity A
Worker 2: Creates activity B
Result: Duplicate activities! ❌
```

**Solution With Distributed Locking:**
```
Worker 1: Acquires lock → processes → releases
Worker 2: Waits for lock → finds existing state → merges
Result: Single aggregated activity ✅
```

#### Lock Timeout and Recovery

```typescript
// Lock TTL calculation
const AGGREGATION_WINDOW_MS = 3000;
const PROCESSING_BUFFER_MS = 10000;
const lockTtl = Math.ceil((AGGREGATION_WINDOW_MS + PROCESSING_BUFFER_MS) / 1000);

// If a worker crashes while holding the lock:
// 1. Redis automatically expires the lock after TTL
// 2. Other workers can acquire the lock and continue processing
// 3. Flush timer in crashed worker becomes irrelevant
```

#### State Store Keys and Data

```
Lock Key: "saga:feed:lock:card-123-user-abc"
Value: "1" 
TTL: 13 seconds

Pending Activity Key: "saga:feed:pending:card-123-user-abc"  
Value: {
  "cardId": "card-123",
  "actorId": "user-abc", 
  "collectionIds": ["coll-1", "coll-2"],
  "timestamp": "2024-01-15T10:30:00.000Z",
  "hasLibraryEvent": true,
  "hasCollectionEvents": true
}
TTL: 8 seconds (aggregation window + buffer)
```

### Worker Failure Scenarios

#### Worker Crashes After Lock Acquisition

```
Time: T0
Worker 1: Acquires lock, starts processing
Worker 1: CRASHES 💥 (before releasing lock)

Time: T0+13s  
Redis: Lock expires automatically
Worker 2: Can now acquire lock and continue processing
```

#### Worker Crashes During Flush

```
Time: T0+3000ms
Worker 1: Flush timer fires, acquires lock
Worker 1: CRASHES 💥 (before completing flush)

Time: T0+3013s
Redis: Lock expires
Worker 2: Timer fires, acquires lock, completes flush
```

#### Network Partition

```
Worker 1: Loses Redis connection
Worker 1: Cannot acquire/release locks
Worker 2 & 3: Continue processing normally
Worker 1: Reconnects, participates in future events
```

### Performance Characteristics

#### Lock Contention

- **Low contention**: Different card/user combinations → parallel processing
- **High contention**: Same card/user → sequential processing (by design)
- **Lock duration**: ~1-5ms per event (very brief)

#### Throughput Impact

```
Single Worker: 1000 events/sec
Multiple Workers (different cards): 3000 events/sec (3x scaling)
Multiple Workers (same card): 1000 events/sec (sequential by design)
```

#### Memory Usage

```
Per Pending Activity: ~200 bytes in Redis
Lock Overhead: ~50 bytes per lock
Cleanup: Automatic via TTL expiration
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
