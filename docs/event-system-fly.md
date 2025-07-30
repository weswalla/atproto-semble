# Event System Implementation Options on Fly.io

This document outlines the available options for implementing a distributed message/work queue system for our TypeScript backend on Fly.io, building on our existing domain event architecture.

## Overview

Our current in-memory domain event system works well for single-instance deployments, but as we scale to multiple regions and instances on Fly.io, we need a distributed approach. This guide covers three main options that integrate well with our existing DDD architecture.

## Current Architecture Context

We have:
- Domain events raised by aggregates (e.g., `CardAddedToLibraryEvent`)
- Event handlers in the application layer
- An `EventHandlerRegistry` that wires events to handlers
- Events dispatched after successful persistence

## Option 1: BullMQ with Redis/Valkey (Recommended)

**Best for**: Most use cases, especially with our TypeScript stack

### How it Works

1. Domain events are published to Redis/Valkey queues via BullMQ
2. Worker processes pull jobs from queues and execute event handlers
3. Built-in retry logic, rate limiting, and job scheduling
4. Excellent TypeScript support and monitoring capabilities

### Implementation Architecture

```typescript
// Infrastructure layer - BullMQ Event Publisher
export class BullMQEventPublisher {
  private queues: Map<string, Queue> = new Map();

  constructor(private redisConnection: ConnectionOptions) {}

  async publish(event: IDomainEvent): Promise<void> {
    const queueName = `events.${event.constructor.name}`;
    
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, new Queue(queueName, {
        connection: this.redisConnection,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }));
    }

    const queue = this.queues.get(queueName)!;
    await queue.add(event.constructor.name, {
      ...event,
      aggregateId: event.getAggregateId().toString(),
    });
  }
}

// Infrastructure layer - BullMQ Event Worker
export class BullMQEventWorker {
  private workers: Worker[] = [];

  constructor(
    private redisConnection: ConnectionOptions,
    private eventHandlerRegistry: EventHandlerRegistry,
  ) {}

  async startWorkers(): Promise<void> {
    // Start workers for each event type
    const eventTypes = ['CardAddedToLibraryEvent', 'CollectionCreatedEvent'];
    
    for (const eventType of eventTypes) {
      const worker = new Worker(
        `events.${eventType}`,
        async (job) => {
          await this.processEvent(eventType, job.data);
        },
        {
          connection: this.redisConnection,
          concurrency: 5,
        }
      );

      this.workers.push(worker);
    }
  }

  private async processEvent(eventType: string, eventData: any): Promise<void> {
    // Reconstruct event and dispatch to handlers
    // Implementation depends on your event reconstruction strategy
  }
}
```

### Fly.io Deployment

**fly.toml configuration:**
```toml
[processes]
web = "npm start"
worker = "npm run worker"

[env]
REDIS_URL = "redis://your-valkey-instance.internal:6379"

[[services]]
internal_port = 8080
protocol = "tcp"
```

**Scaling:**
```bash
fly scale count web=2 worker=3
fly regions add worker fra ord
```

### Pros
- Excellent TypeScript support
- Rich feature set (delays, retries, rate limiting)
- Great monitoring and debugging tools
- Integrates well with existing Node.js ecosystem
- Battle-tested in production

### Cons
- Requires Redis/Valkey infrastructure
- More complex than simple pub/sub
- Learning curve for BullMQ-specific concepts

## Option 2: On-Demand Workers with Fly Machines

**Best for**: Infrequent jobs, cost optimization, or jobs with varying resource requirements

### How it Works

1. Domain events are stored in Redis/Valkey with job metadata
2. Your app calls Fly Machines API to spin up a worker machine
3. Worker machine processes the job and shuts down
4. Results are stored back in Redis for retrieval

### Implementation Architecture

```typescript
// Infrastructure layer - Fly Machines Event Publisher
export class FlyMachinesEventPublisher {
  constructor(
    private flyApi: FlyMachinesApi,
    private redis: Redis,
    private appName: string,
  ) {}

  async publish(event: IDomainEvent): Promise<void> {
    const jobId = uuid();
    const jobData = {
      id: jobId,
      eventType: event.constructor.name,
      eventData: event,
      aggregateId: event.getAggregateId().toString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Store job data in Redis
    await this.redis.setex(`job:${jobId}`, 3600, JSON.stringify(jobData));

    // Spin up a worker machine
    await this.flyApi.createMachine({
      app: this.appName,
      config: {
        image: 'your-app:latest',
        env: {
          JOB_ID: jobId,
          PROCESS_TYPE: 'event-worker',
          REDIS_URL: process.env.REDIS_URL,
        },
        restart: { policy: 'no' }, // Don't restart, just run once
        auto_destroy: true, // Clean up after completion
      },
    });
  }
}

// Worker process entry point
export class OnDemandEventWorker {
  constructor(
    private redis: Redis,
    private eventHandlerRegistry: EventHandlerRegistry,
  ) {}

  async processJob(jobId: string): Promise<void> {
    try {
      // Fetch job data
      const jobDataStr = await this.redis.get(`job:${jobId}`);
      if (!jobDataStr) {
        throw new Error(`Job ${jobId} not found`);
      }

      const jobData = JSON.parse(jobDataStr);
      
      // Update status
      await this.redis.setex(`job:${jobId}`, 3600, JSON.stringify({
        ...jobData,
        status: 'processing',
        startedAt: new Date().toISOString(),
      }));

      // Process the event
      await this.processEvent(jobData.eventType, jobData.eventData);

      // Mark as completed
      await this.redis.setex(`job:${jobId}`, 3600, JSON.stringify({
        ...jobData,
        status: 'completed',
        completedAt: new Date().toISOString(),
      }));

    } catch (error) {
      // Mark as failed
      await this.redis.setex(`job:${jobId}`, 3600, JSON.stringify({
        ...jobData,
        status: 'failed',
        error: error.message,
        failedAt: new Date().toISOString(),
      }));
      throw error;
    }
  }
}
```

### Fly.io Deployment

**Main app fly.toml:**
```toml
[env]
REDIS_URL = "redis://your-valkey-instance.internal:6379"
FLY_API_TOKEN = "your-api-token"
```

**Worker startup script:**
```typescript
// worker-entrypoint.ts
if (process.env.PROCESS_TYPE === 'event-worker') {
  const jobId = process.env.JOB_ID;
  const worker = new OnDemandEventWorker(redis, eventHandlerRegistry);
  await worker.processJob(jobId);
  process.exit(0);
}
```

### Pros
- Pay only for actual processing time
- Can use different machine sizes per job type
- Automatic cleanup and resource management
- Great for infrequent or resource-intensive jobs
- No idle worker processes

### Cons
- Cold start latency (1-2 seconds)
- More complex orchestration
- Requires Fly Machines API integration
- Not suitable for high-frequency events

## Option 3: Database-Based Event Store with Background Processing

**Best for**: Simplicity, guaranteed persistence, audit requirements

### How it Works

1. Domain events are persisted to PostgreSQL event store table
2. Background worker polls for unprocessed events
3. Events are processed and marked as completed
4. Built-in persistence and audit trail

### Implementation Architecture

```typescript
// Domain layer - Event Store
export interface EventStoreRecord {
  id: string;
  aggregateId: string;
  eventType: string;
  eventData: string;
  version: number;
  timestamp: Date;
  processed: boolean;
  processedAt?: Date;
  attempts: number;
  lastError?: string;
}

// Infrastructure layer - Drizzle Event Store
export class DrizzleEventStore implements IEventStore {
  constructor(private db: PostgresJsDatabase) {}

  async saveEvent(event: IDomainEvent): Promise<Result<void>> {
    try {
      await this.db.insert(eventStore).values({
        id: uuid(),
        aggregateId: event.getAggregateId().toString(),
        eventType: event.constructor.name,
        eventData: JSON.stringify(event),
        version: 1,
        timestamp: event.dateTimeOccurred,
        processed: false,
        attempts: 0,
      });

      return ok();
    } catch (error) {
      return err(error);
    }
  }

  async getUnprocessedEvents(limit = 100): Promise<Result<EventStoreRecord[]>> {
    try {
      const events = await this.db
        .select()
        .from(eventStore)
        .where(
          and(
            eq(eventStore.processed, false),
            lt(eventStore.attempts, 3) // Max 3 attempts
          )
        )
        .orderBy(eventStore.timestamp)
        .limit(limit);

      return ok(events);
    } catch (error) {
      return err(error);
    }
  }
}

// Infrastructure layer - Background Event Processor
export class BackgroundEventProcessor {
  private isRunning = false;

  constructor(
    private eventStore: IEventStore,
    private eventHandlerRegistry: EventHandlerRegistry,
    private intervalMs = 5000,
  ) {}

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.processLoop();
  }

  private async processLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.processEvents();
        await this.sleep(this.intervalMs);
      } catch (error) {
        console.error('Error in event processing loop:', error);
        await this.sleep(this.intervalMs);
      }
    }
  }

  private async processEvents(): Promise<void> {
    const eventsResult = await this.eventStore.getUnprocessedEvents();
    if (eventsResult.isErr()) return;

    for (const eventRecord of eventsResult.value) {
      await this.processEvent(eventRecord);
    }
  }
}
```

### Fly.io Deployment

**fly.toml:**
```toml
[processes]
web = "npm start"
worker = "npm run event-processor"

[env]
DATABASE_URL = "postgresql://..."
```

### Pros
- Uses existing PostgreSQL infrastructure
- Guaranteed persistence and ACID transactions
- Built-in audit trail and event history
- Simple to understand and debug
- No additional infrastructure required

### Cons
- Polling-based (not real-time)
- Database load from frequent polling
- Less sophisticated than dedicated queue systems
- Manual retry and error handling logic

## Integration with Existing Domain Events

### Updating EventHandlerRegistry

```typescript
export class DistributedEventHandlerRegistry extends EventHandlerRegistry {
  constructor(
    feedsCardAddedToLibraryHandler: FeedsCardAddedToLibraryEventHandler,
    notificationsCardAddedToLibraryHandler: NotificationsCardAddedToLibraryEventHandler,
    private eventPublisher: BullMQEventPublisher | FlyMachinesEventPublisher | DrizzleEventStore,
  ) {
    super(feedsCardAddedToLibraryHandler, notificationsCardAddedToLibraryHandler);
  }

  registerAllHandlers(): void {
    // Register local handlers (existing logic)
    super.registerAllHandlers();

    // Also publish events to distributed system
    DomainEvents.register(
      async (event: CardAddedToLibraryEvent) => {
        await this.eventPublisher.publish(event);
      },
      CardAddedToLibraryEvent.name,
    );
  }
}
```

### Factory Integration

```typescript
// In ServiceFactory
export class ServiceFactory {
  static create(
    configService: EnvironmentConfigService,
    repositories: Repositories,
  ): Services {
    // ... existing services

    // Choose your event publisher based on configuration
    let eventPublisher;
    
    if (configService.get('EVENT_SYSTEM') === 'bullmq') {
      eventPublisher = new BullMQEventPublisher({
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
      });
    } else if (configService.get('EVENT_SYSTEM') === 'machines') {
      eventPublisher = new FlyMachinesEventPublisher(
        flyApi,
        redis,
        configService.get('FLY_APP_NAME'),
      );
    } else {
      eventPublisher = new DrizzleEventStore(db);
    }

    const eventHandlerRegistry = new DistributedEventHandlerRegistry(
      feedsCardAddedToLibraryHandler,
      notificationsCardAddedToLibraryHandler,
      eventPublisher,
    );

    eventHandlerRegistry.registerAllHandlers();

    return {
      // ... existing services
      eventHandlerRegistry,
      eventPublisher,
    };
  }
}
```

## Recommendations

### For Most Applications: BullMQ + Valkey
- **Use when**: You have regular event processing needs
- **Scaling**: Start with 1-2 worker instances, scale based on queue depth
- **Cost**: Moderate (persistent workers + Redis/Valkey)

### For Infrequent Jobs: Fly Machines
- **Use when**: Events happen < 100 times per day
- **Scaling**: Automatic (one machine per job)
- **Cost**: Low (pay per job execution)

### For Simplicity: Database Event Store
- **Use when**: You want to avoid additional infrastructure
- **Scaling**: Single background processor initially
- **Cost**: Low (uses existing database)

## Migration Strategy

1. **Phase 1**: Implement database event store for immediate distributed capability
2. **Phase 2**: Add BullMQ for high-frequency events while keeping database store for audit
3. **Phase 3**: Migrate heavy/infrequent jobs to Fly Machines as needed

## Monitoring and Observability

### BullMQ
- Use Bull Dashboard for queue monitoring
- Implement custom metrics for job success/failure rates
- Set up alerts for queue depth and processing delays

### Fly Machines
- Monitor machine creation/destruction rates
- Track job completion times and failure rates
- Use Fly.io metrics for resource utilization

### Database Event Store
- Monitor unprocessed event count
- Track processing latency and error rates
- Set up alerts for stuck events

## Next Steps

1. Choose your initial implementation based on current needs
2. Set up Redis/Valkey infrastructure on Fly.io
3. Implement the chosen event publisher in your `EventHandlerRegistry`
4. Deploy and test with a single event type
5. Gradually migrate all domain events to the distributed system
6. Monitor and optimize based on actual usage patterns

This architecture provides a solid foundation for scaling your domain events across multiple Fly.io regions while maintaining the clean separation of concerns in your DDD architecture.
