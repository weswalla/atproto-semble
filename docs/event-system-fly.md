# Distributed Event System Implementation with BullMQ on Fly.io

This document provides a comprehensive guide for implementing a distributed event system using BullMQ and Redis/Valkey on Fly.io, specifically designed for high-frequency social features like notifications and activity feeds.

## Overview

Our current in-memory domain event system works well for single-instance deployments, but as we scale to multiple regions and instances on Fly.io, we need a distributed approach. For applications with frequent URL additions that trigger notifications and social activity feeds, **BullMQ with Redis/Valkey is the recommended solution**.

## Why BullMQ + Redis/Valkey?

### Perfect for Social Features

- **High Throughput**: Handle thousands of events per second for URL additions
- **Real-time Processing**: Near-instant notifications and feed updates
- **Reliable Delivery**: Built-in retry logic ensures notifications aren't lost
- **Rate Limiting**: Prevent overwhelming external services (email, push notifications)
- **Priority Queues**: Process notifications faster than feed updates

### Technical Advantages

- **Excellent TypeScript Support**: First-class TypeScript integration
- **Rich Feature Set**: Delays, retries, rate limiting, job scheduling
- **Great Monitoring**: Built-in dashboard and metrics
- **Battle-tested**: Used in production by many high-scale applications
- **Flexible Scaling**: Scale workers independently from web servers

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Server    │    │   Redis/Valkey  │    │  Worker Nodes   │
│                 │    │                 │    │                 │
│ Domain Events ──┼───▶│ BullMQ Queues  ├───▶│ Event Handlers  │
│                 │    │                 │    │                 │
│ - Card Added    │    │ - Notifications │    │ - Send Emails   │
│ - URL Shared    │    │ - Feeds         │    │ - Update Feeds  │
│ - Collection    │    │ - Analytics     │    │ - Track Events  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Process Flow: How Events Get Triggered

Understanding how events flow from HTTP requests to worker processes is crucial for debugging and scaling:

### 1. Web Process (HTTP Request Triggered)

```
HTTP Request → Use Case → Domain Logic → Event Publishing → HTTP Response
     ↓              ↓           ↓              ↓              ↓
POST /cards    AddCardToLib  card.addTo()  publishEvents()  200 OK
```

**What happens:**

- User makes HTTP request to your API
- Express/Fastify routes to use case
- Use case executes domain logic (adds domain events to aggregate)
- Use case saves to database
- Use case publishes events to Redis queue via `BullMQEventPublisher`
- HTTP response returned immediately (don't wait for event processing)

### 2. Redis Queue (Event Storage)

```
BullMQEventPublisher → Redis Queue → Job Storage
        ↓                  ↓            ↓
   Serialize Event    Store in Queue   Wait for Worker
```

**What happens:**

- Events are serialized to JSON
- Stored in Redis with retry/priority configuration
- BullMQ manages job lifecycle, retries, and failure handling

### 3. Worker Process (Polling Triggered)

```
Worker Polling → Job Found → Event Handler → Job Complete
      ↓             ↓            ↓             ↓
   redis.poll()  processJob()  handler.handle()  ack/nack
```

**What happens:**

- Worker processes continuously poll Redis for new jobs
- When job found, BullMQ calls your `processJob()` method
- Event is reconstructed from serialized data
- Your event handler is called with the reconstructed event
- Job marked as complete or failed based on handler result

### 4. Key Differences from Web Process

| Aspect           | Web Process          | Worker Process          |
| ---------------- | -------------------- | ----------------------- |
| **Trigger**      | HTTP Request         | Redis Job Available     |
| **Lifecycle**    | Request/Response     | Long-running polling    |
| **Scaling**      | Scale with traffic   | Scale with queue depth  |
| **Failure**      | Return error to user | Retry job automatically |
| **Dependencies** | Database, Redis      | Database, External APIs |

## Implementation Guide

### Step 1: Install Dependencies

```bash
npm install bullmq ioredis
npm install --save-dev @types/ioredis
```

### Step 2: Infrastructure Layer - Event Publisher

Create the BullMQ event publisher that implements the `IEventPublisher` interface:

```typescript
// src/shared/infrastructure/events/BullMQEventPublisher.ts
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { IEventPublisher } from '../../application/events/IEventPublisher';
import { IDomainEvent } from '../../domain/events/IDomainEvent';
import { Result, ok, err } from '../../core/Result';

export class BullMQEventPublisher implements IEventPublisher {
  private queues: Map<string, Queue> = new Map();

  constructor(private redisConnection: Redis) {}

  async publishEvents(events: IDomainEvent[]): Promise<Result<void>> {
    try {
      for (const event of events) {
        await this.publishSingleEvent(event);
      }
      return ok(undefined);
    } catch (error) {
      return err(error as Error);
    }
  }

  private async publishSingleEvent(event: IDomainEvent): Promise<void> {
    const queueConfig = this.getQueueConfig(event);

    if (!this.queues.has(queueConfig.name)) {
      this.queues.set(
        queueConfig.name,
        new Queue(queueConfig.name, {
          connection: this.redisConnection,
          defaultJobOptions: queueConfig.options,
        }),
      );
    }

    const queue = this.queues.get(queueConfig.name)!;
    await queue.add(event.constructor.name, {
      eventType: event.constructor.name,
      aggregateId: event.getAggregateId().toString(),
      dateTimeOccurred: event.dateTimeOccurred.toISOString(),
      // Serialize the event data
      cardId: (event as any).cardId?.getValue?.()?.toString(),
      curatorId: (event as any).curatorId?.value,
    });
  }

  private getQueueConfig(event: IDomainEvent) {
    // Route events to appropriate queues
    if (event.constructor.name === 'CardAddedToLibraryEvent') {
      return {
        name: 'notifications',
        options: {
          priority: 1,
          attempts: 5,
          backoff: { type: 'exponential' as const, delay: 1000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      };
    }

    return {
      name: 'events',
      options: {
        priority: 2,
        attempts: 3,
        backoff: { type: 'exponential' as const, delay: 2000 },
        removeOnComplete: 50,
        removeOnFail: 25,
      },
    };
  }

  async close(): Promise<void> {
    await Promise.all(
      Array.from(this.queues.values()).map((queue) => queue.close()),
    );
  }
}
```

### Step 3: Infrastructure Layer - Event Subscriber

Create the BullMQ event subscriber that implements the `IEventSubscriber` interface:

```typescript
// src/shared/infrastructure/events/BullMQEventSubscriber.ts
import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import {
  IEventSubscriber,
  IEventHandler,
} from '../../application/events/IEventSubscriber';
import { IDomainEvent } from '../../domain/events/IDomainEvent';
import { CardAddedToLibraryEvent } from '../../../modules/cards/domain/events/CardAddedToLibraryEvent';
import { CardId } from '../../../modules/cards/domain/value-objects/CardId';
import { CuratorId } from '../../../modules/cards/domain/value-objects/CuratorId';

export class BullMQEventSubscriber implements IEventSubscriber {
  private workers: Worker[] = [];
  private handlers: Map<string, IEventHandler<any>> = new Map();

  constructor(private redisConnection: Redis) {}

  async subscribe<T extends IDomainEvent>(
    eventType: string,
    handler: IEventHandler<T>,
  ): Promise<void> {
    this.handlers.set(eventType, handler);
  }

  async start(): Promise<void> {
    // Start workers for different queues
    const queues = ['notifications', 'events'];

    for (const queueName of queues) {
      const worker = new Worker(
        queueName,
        async (job: Job) => {
          await this.processJob(job);
        },
        {
          connection: this.redisConnection,
          concurrency: queueName === 'notifications' ? 5 : 15,
        },
      );

      worker.on('completed', (job) => {
        console.log(`Job ${job.id} completed successfully`);
      });

      worker.on('failed', (job, err) => {
        console.error(`Job ${job?.id} failed:`, err);
      });

      worker.on('error', (err) => {
        console.error('Worker error:', err);
      });

      this.workers.push(worker);
    }
  }

  async stop(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.close()));
    this.workers = [];
  }

  private async processJob(job: Job): Promise<void> {
    const eventData = job.data;
    const eventType = eventData.eventType;

    const handler = this.handlers.get(eventType);
    if (!handler) {
      console.warn(`No handler registered for event type: ${eventType}`);
      return;
    }

    const event = this.reconstructEvent(eventData);
    const result = await handler.handle(event);

    if (result.isErr()) {
      throw result.error;
    }
  }

  private reconstructEvent(eventData: any): IDomainEvent {
    if (eventData.eventType === 'CardAddedToLibraryEvent') {
      const cardId = CardId.create(eventData.cardId).unwrap();
      const curatorId = CuratorId.create(eventData.curatorId).unwrap();

      const event = new CardAddedToLibraryEvent(cardId, curatorId);
      (event as any).dateTimeOccurred = new Date(eventData.dateTimeOccurred);

      return event;
    }

    throw new Error(`Unknown event type: ${eventData.eventType}`);
  }
}
```

### Step 4: Update Event Handler Registry

Update your existing registry to publish events to the distributed system:

```typescript
// src/shared/infrastructure/events/EventHandlerRegistry.ts
import { DomainEvents } from '../../domain/events/DomainEvents';
import { CardAddedToLibraryEvent } from '../../../modules/cards/domain/events/CardAddedToLibraryEvent';
import { IEventPublisher } from '../../application/events/IEventPublisher';

export class EventHandlerRegistry {
  constructor(private eventPublisher: IEventPublisher) {}

  registerAllHandlers(): void {
    // Register distributed event publishing
    DomainEvents.register(async (event: CardAddedToLibraryEvent) => {
      try {
        await this.eventPublisher.publishEvents([event]);
      } catch (error) {
        console.error('Error publishing event to BullMQ:', error);
        // Don't fail the main operation if event publishing fails
      }
    }, CardAddedToLibraryEvent.name);
  }

  clearAllHandlers(): void {
    DomainEvents.clearHandlers();
  }
}
```

### Step 5: Fly.io Infrastructure Setup

#### Set up Redis with Fly

```bash
# Create an Upstash Redis database via Fly
fly redis create --name myapp-redis --region ord

# For production, add replica regions for better performance
fly redis create --name myapp-redis --region ord --replica-regions fra,iad

# Check available plans if you need more capacity
fly redis plans

# View your Redis databases
fly redis list
```

After creation, Fly will provide you with connection details. You can also check the status:

```bash
# Check Redis status and get connection info
fly redis status myapp-redis

# Connect to Redis for testing
fly redis connect myapp-redis
```

#### Configure fly.toml for Worker Processes

Fly.io supports multiple process types in a single app. Here's how to configure your `fly.toml` to run both web servers and worker processes:

```toml
# fly.toml
app = "myapp"
primary_region = "sea"

[build]
  dockerfile = "Dockerfile"

# Define different process types
[processes]
  web = "npm start"
  notification-worker = "npm run worker:notifications"
  feed-worker = "npm run worker:feeds"

[env]
  NODE_ENV = "production"
  # Redis URL will be automatically set by Fly when you attach the Redis database

# HTTP service configuration - ONLY applies to web processes
[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = 'stop'
  auto_start_machines = true
  min_machines_running = 0
  processes = ['web']  # Only web processes handle HTTP traffic

# Default VM configuration for all processes
[[vm]]
  memory = '1gb'
  cpu_kind = 'shared'
  cpus = 1

# Override VM settings for specific process types
[[vm]]
  processes = ['notification-worker']
  memory = '512mb'  # Workers typically need less memory
  cpu_kind = 'shared'
  cpus = 1

[[vm]]
  processes = ['feed-worker']
  memory = '512mb'
  cpu_kind = 'shared'
  cpus = 1

[deploy]
  strategy = "rolling"
```

**Key Configuration Points:**

1. **Process Types**: Define each worker as a separate process type
2. **HTTP Service**: Only applies to web processes (workers don't need HTTP)
3. **VM Configuration**: Can be customized per process type
4. **Auto-scaling**: Workers can have different scaling rules than web processes

#### Update package.json Scripts

Add worker scripts to your `package.json`:

```json
// package.json
{
  "scripts": {
    "start": "node dist/index.js",
    "worker:notifications": "node dist/workers/notification-worker.js",
    "worker:feeds": "node dist/workers/feed-worker.js",
    "build": "tsup",
    "dev": "concurrently \"tsc --watch\" \"nodemon dist/index.js\""
  }
}
```

**Important Notes:**

- Workers and web processes use the same build output (`dist/`)
- All processes are built together with `npm run build`
- Each process type runs a different entry point

```typescript
// src/workers/notification-worker.ts
import Redis from 'ioredis';
import { BullMQEventSubscriber } from '../shared/infrastructure/events/BullMQEventSubscriber';
import { CardAddedToLibraryEventHandler } from '../modules/notifications/application/eventHandlers/CardAddedToLibraryEventHandler';
import { EnvironmentConfigService } from '../shared/infrastructure/config/EnvironmentConfigService';

async function startNotificationWorker() {
  console.log('Starting notification worker...');

  const configService = new EnvironmentConfigService();

  // Connect to Redis
  const redisUrl = configService.get('REDIS_URL');
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is required');
  }

  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true,
  });

  // Test Redis connection
  try {
    await redis.ping();
    console.log('Connected to Redis successfully');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    process.exit(1);
  }

  // Create subscriber
  const eventSubscriber = new BullMQEventSubscriber(redis);

  // Create event handlers (wire up your services here)
  const notificationHandler = new CardAddedToLibraryEventHandler(
    notificationService,
  );

  // Register handlers
  await eventSubscriber.subscribe(
    'CardAddedToLibraryEvent',
    notificationHandler,
  );

  // Start the worker - THIS IS WHAT TRIGGERS YOUR HANDLERS!
  await eventSubscriber.start();

  console.log('Notification worker started and listening for events...');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down notification worker...');
    await eventSubscriber.stop();
    await redis.quit();
    process.exit(0);
  });
}

startNotificationWorker().catch(console.error);
```

### Step 5: Service Factory Integration

Update your service factory to use the distributed event system:

```typescript
// In your ServiceFactory
export class ServiceFactory {
  static create(
    configService: EnvironmentConfigService,
    repositories: Repositories,
  ): Services {
    // ... existing services

    // Redis connection - Fly Redis provides a full connection URL
    const redisUrl = configService.get('REDIS_URL');
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is required');
    }

    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
    });

    // Event publisher
    const eventPublisher = new BullMQEventPublisher(redis);

    // Event handler registry
    const eventHandlerRegistry = new EventHandlerRegistry(eventPublisher);
    eventHandlerRegistry.registerAllHandlers();

    return {
      // ... existing services
      eventHandlerRegistry,
      eventPublisher,
    };
  }
}
```

### Step 6: Create Use Cases with Event Publishing

Update your use cases to extend `BaseUseCase` and publish events:

```typescript
// src/modules/cards/application/use-cases/AddCardToLibraryUseCase.ts
import { BaseUseCase } from '../../../../shared/core/UseCase';
import { Result, ok, err } from '../../../../shared/core/Result';
import { IEventPublisher } from '../../../../shared/application/events/IEventPublisher';
import { ICardRepository } from '../../domain/ICardRepository';

interface AddCardToLibraryRequest {
  cardId: string;
  userId: string;
}

export class AddCardToLibraryUseCase extends BaseUseCase<
  AddCardToLibraryRequest,
  Result<void>
> {
  constructor(
    private cardRepository: ICardRepository,
    eventPublisher: IEventPublisher,
  ) {
    super(eventPublisher);
  }

  async execute(request: AddCardToLibraryRequest): Promise<Result<void>> {
    // 1. Get the card
    const cardResult = await this.cardRepository.findById(
      CardId.create(request.cardId).unwrap(),
    );
    if (cardResult.isErr()) return err(cardResult.error);

    const card = cardResult.value;
    if (!card) return err(new Error('Card not found'));

    // 2. Execute domain logic (adds events to aggregate)
    const curatorId = CuratorId.create(request.userId).unwrap();
    const addResult = card.addToLibrary(curatorId);
    if (addResult.isErr()) return err(addResult.error);

    // 3. Save to repository
    const saveResult = await this.cardRepository.save(card);
    if (saveResult.isErr()) return err(saveResult.error);

    // 4. Publish events after successful save
    const publishResult = await this.publishEventsForAggregate(card);
    if (publishResult.isErr()) {
      console.error('Failed to publish events:', publishResult.error);
      // Don't fail the operation if event publishing fails
    }

    return ok(undefined);
  }
}
```

## Deployment Strategy

### Step-by-Step Deployment Process

#### 1. Create and Configure Redis

```bash
# Create Redis database with replicas for better performance
fly redis create --name myapp-redis --region ord --replica-regions fra,iad

# Attach Redis to your app (sets REDIS_URL environment variable)
fly redis attach myapp-redis

# Verify Redis connection details
fly redis status myapp-redis
```

#### 2. Update Your Application Configuration

Ensure your `fly.toml` includes worker processes:

```toml
[processes]
  web = "npm start"
  notification-worker = "npm run worker:notifications"
  feed-worker = "npm run worker:feeds"

[http_service]
  processes = ['web']  # Only web processes handle HTTP
```

#### 3. Deploy All Processes

```bash
# Deploy the entire application (web + workers)
fly deploy

# Check deployment status
fly status

# View all running processes
fly ps
```

#### 4. Scale Worker Processes

```bash
# Scale different process types independently
fly scale count web=2 notification-worker=2 feed-worker=3

# Scale to specific regions
fly scale count web=2 --region ord
fly scale count notification-worker=1 --region ord
fly scale count notification-worker=1 --region fra
fly scale count feed-worker=2 --region ord
fly scale count feed-worker=1 --region fra

# Check current scaling
fly scale show
```

#### 5. Monitor Worker Health

```bash
# Monitor worker logs
fly logs --process notification-worker
fly logs --process feed-worker

# Check specific worker instances
fly logs --process notification-worker --region ord

# Monitor Redis connectivity
fly redis connect myapp-redis
```

### Understanding Fly.io Worker Deployment

#### How Fly.io Handles Multiple Process Types

**Single App, Multiple Process Types:**

- All processes (web, workers) are part of the same Fly app
- They share the same Docker image and environment variables
- Each process type can be scaled independently
- Workers run as long-lived background processes

**Deployment Flow:**

1. `fly deploy` builds one Docker image
2. Fly creates different machine types based on `[processes]` config
3. Each machine runs the specified command for its process type
4. HTTP service only applies to processes listed in `[http_service].processes`

#### Process Type Differences

| Aspect              | Web Process                 | Worker Processes               |
| ------------------- | --------------------------- | ------------------------------ |
| **Command**         | `npm start`                 | `npm run worker:notifications` |
| **HTTP Traffic**    | ✅ Receives HTTP requests   | ❌ No HTTP traffic             |
| **Load Balancer**   | ✅ Behind Fly proxy         | ❌ Direct process              |
| **Health Checks**   | HTTP endpoint               | Process running                |
| **Scaling Trigger** | HTTP traffic                | Queue depth                    |
| **Auto-stop**       | Can auto-stop when idle     | Should run continuously        |
| **Regions**         | Scale based on user traffic | Scale based on workload        |

#### Worker-Specific Configuration

**Prevent Auto-stopping Workers:**

```toml
# In fly.toml - workers should not auto-stop
[http_service]
  auto_stop_machines = 'stop'
  processes = ['web']  # Only web processes auto-stop

# Or disable auto-stop entirely for workers
[[vm]]
  processes = ['notification-worker', 'feed-worker']
  auto_stop_machines = false
```

**Worker Health Monitoring:**

```bash
# Workers don't have HTTP health checks
# Monitor via logs and process status
fly logs --process notification-worker --follow

# Check if worker processes are running
fly ps | grep worker

# SSH into worker for debugging
fly ssh console --process notification-worker
```

#### Environment Variables and Secrets

**Shared Environment:**

- All process types share the same environment variables
- Redis URL, database URL, etc. are available to all processes
- Secrets are shared across all process types

```bash
# Set environment variables for all processes
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set REDIS_URL="redis://..."

# Check environment in worker
fly ssh console --process notification-worker
env | grep REDIS_URL
```

#### Deployment Dependencies and Order

**Critical Deployment Order:**

1. **Redis First**: Must exist before workers can start
2. **Database**: Must be accessible to both web and workers
3. **Deploy**: All processes deploy together
4. **Scale**: Scale workers after successful deployment

```bash
# 1. Ensure Redis exists
fly redis status myapp-redis || fly redis create --name myapp-redis

# 2. Ensure Redis is attached
fly redis attach myapp-redis

# 3. Deploy all processes
fly deploy

# 4. Verify all process types started
fly ps

# 5. Scale workers as needed
fly scale count notification-worker=2 feed-worker=3
```

**Common Deployment Issues:**

1. **Workers Exit Immediately**

   ```bash
   # Check worker logs for startup errors
   fly logs --process notification-worker

   # Common causes:
   # - Missing REDIS_URL
   # - Redis connection failed
   # - Missing dependencies in package.json
   ```

2. **Workers Can't Connect to Redis**

   ```bash
   # Verify Redis attachment
   fly redis status myapp-redis

   # Test Redis connection from worker
   fly ssh console --process notification-worker
   node -e "const Redis = require('ioredis'); const r = new Redis(process.env.REDIS_URL); r.ping().then(console.log)"
   ```

3. **Workers Not Processing Jobs**

   ```bash
   # Check if jobs are being queued
   fly redis connect myapp-redis
   > KEYS *
   > LLEN bull:notifications:waiting

   # Check worker logs for processing
   fly logs --process notification-worker --follow
   ```

### Worker Scaling Guidelines

#### Notification Workers (External API Calls)

```bash
# Conservative scaling for external APIs
fly scale count notification-worker=2 --region ord
fly scale count notification-worker=1 --region fra

# Monitor and adjust based on:
# - External API rate limits
# - Queue depth
# - Processing time
```

**Configuration:**

- **Concurrency**: 5-10 jobs per worker (respect API limits)
- **Regions**: 2-3 regions max (avoid hitting API limits from too many IPs)
- **Memory**: 512MB usually sufficient
- **Scaling Trigger**: Queue depth > 100 jobs

#### Feed Workers (Database Operations)

```bash
# More aggressive scaling for database operations
fly scale count feed-worker=3 --region ord
fly scale count feed-worker=2 --region fra

# Scale based on:
# - Database connection limits
# - Queue processing speed
# - Regional user distribution
```

**Configuration:**

- **Concurrency**: 10-20 jobs per worker (database can handle more)
- **Regions**: Match your user distribution
- **Memory**: 512MB-1GB depending on data processing
- **Scaling Trigger**: Queue depth > 50 jobs

#### Scaling Commands Reference

```bash
# View current scaling
fly scale show

# Scale specific process types
fly scale count web=2 notification-worker=2 feed-worker=3

# Scale to specific regions
fly scale count notification-worker=1 --region ord
fly scale count notification-worker=1 --region fra

# Scale with memory adjustments
fly scale memory 1gb --process feed-worker
fly scale memory 512mb --process notification-worker

# Auto-scaling (if using Fly's auto-scaling features)
fly autoscale set min=1 max=5 --process notification-worker
fly autoscale set min=2 max=8 --process feed-worker
```

#### Monitoring Scaling Effectiveness

```bash
# Monitor queue depths
fly redis connect myapp-redis
> LLEN bull:notifications:waiting
> LLEN bull:feeds:waiting

# Monitor worker performance
fly logs --process notification-worker | grep "Job.*completed"
fly logs --process feed-worker | grep "processing time"

# Check resource usage
fly metrics --process notification-worker
fly metrics --process feed-worker
```

### Monitoring and Observability

#### BullMQ Dashboard

```typescript
// Optional: Add Bull Dashboard for monitoring
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

const { addQueue } = createBullBoard({
  queues: [new BullMQAdapter(notificationQueue), new BullMQAdapter(feedQueue)],
  serverAdapter: serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
```

#### Custom Metrics

```typescript
// Track event processing metrics
export class EventMetrics {
  private static eventCounts = new Map<string, number>();
  private static processingTimes = new Map<string, number[]>();

  static recordEvent(eventType: string, processingTime: number): void {
    // Increment count
    const count = this.eventCounts.get(eventType) || 0;
    this.eventCounts.set(eventType, count + 1);

    // Track processing time
    const times = this.processingTimes.get(eventType) || [];
    times.push(processingTime);
    if (times.length > 100) times.shift(); // Keep last 100
    this.processingTimes.set(eventType, times);
  }

  static getMetrics() {
    const metrics: any = {};

    for (const [eventType, count] of this.eventCounts) {
      const times = this.processingTimes.get(eventType) || [];
      const avgTime =
        times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

      metrics[eventType] = {
        count,
        averageProcessingTime: avgTime,
        recentProcessingTimes: times.slice(-10),
      };
    }

    return metrics;
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
// Test event publishing
describe('BullMQEventPublisher', () => {
  it('should publish CardAddedToLibraryEvent to notifications queue', async () => {
    const mockQueue = {
      add: jest.fn().mockResolvedValue({}),
    };

    const publisher = new BullMQEventPublisher(redisConnection);
    (publisher as any).queues.set('notifications', mockQueue);

    const event = new CardAddedToLibraryEvent(
      cardId,
      curatorId,
      CardTypeEnum.URL,
    );
    await publisher.publish(event);

    expect(mockQueue.add).toHaveBeenCalledWith(
      'CardAddedToLibraryEvent',
      expect.objectContaining({
        cardId,
        curatorId,
        cardType: CardTypeEnum.URL,
      }),
    );
  });
});
```

### Integration Tests

```typescript
// Test end-to-end event flow
describe('Event Processing Integration', () => {
  it('should process CardAddedToLibraryEvent through the queue', async () => {
    const mockNotificationHandler = {
      handle: jest.fn().mockResolvedValue({}),
    };

    // Publish event
    const event = new CardAddedToLibraryEvent(
      cardId,
      curatorId,
      CardTypeEnum.URL,
    );
    await eventPublisher.publish(event);

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify handler was called
    expect(mockNotificationHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        cardId,
        curatorId,
        cardType: CardTypeEnum.URL,
      }),
    );
  });
});
```

## Performance Optimization

### Queue Configuration

```typescript
// Optimize for your specific use case
const queueOptions = {
  // For high-frequency events
  defaultJobOptions: {
    removeOnComplete: 100, // Keep successful jobs for debugging
    removeOnFail: 50, // Keep failed jobs for analysis
    attempts: 3, // Retry failed jobs
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2s delay
    },
  },

  // Connection pooling
  connection: {
    ...redisConnection,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true,
  },
};
```

### Worker Optimization

```typescript
// Optimize worker settings
const workerOptions = {
  concurrency: process.env.NODE_ENV === 'production' ? 10 : 5,

  // Batch processing for better performance
  stalledInterval: 30000,
  maxStalledCount: 1,

  // Memory management
  removeOnComplete: 100,
  removeOnFail: 50,
};
```

## Troubleshooting

### Common Issues

1. **Events not processing**: Check Redis connection and worker status
2. **High memory usage**: Adjust `removeOnComplete` and `removeOnFail` settings
3. **Slow processing**: Increase worker concurrency or add more workers
4. **Failed jobs**: Check error logs and adjust retry settings

### Debugging Commands

```bash
# Check worker status
fly logs --app myapp --process notification-worker

# Monitor Redis
fly redis connect myapp-redis
> MONITOR

# Check Redis status and connection info
fly redis status myapp-redis

# Proxy to Redis for local debugging
fly redis proxy myapp-redis

# Check queue status
fly ssh console --app myapp
> npm run queue:status
```

## Complete Deployment Checklist

### Phase 1: Infrastructure Setup

1. **Create Redis Database**

   ```bash
   fly redis create --name myapp-redis --region ord --replica-regions fra,iad
   fly redis attach myapp-redis
   fly redis status myapp-redis  # Verify creation
   ```

2. **Update Application Configuration**
   - ✅ Add worker processes to `fly.toml`
   - ✅ Add worker scripts to `package.json`
   - ✅ Configure HTTP service for web processes only
   - ✅ Set appropriate VM resources for workers

### Phase 2: Code Implementation

3. **Implement Event System**
   - ✅ Create `BullMQEventPublisher`
   - ✅ Create `BullMQEventSubscriber`
   - ✅ Update service factory to use distributed events
   - ✅ Create worker entry points

4. **Create Worker Files**
   ```bash
   # Ensure these files exist:
   ls src/workers/notification-worker.ts
   ls src/workers/feed-worker.ts
   ```

### Phase 3: Deployment

5. **Deploy Application**

   ```bash
   # Build and deploy all processes
   fly deploy

   # Verify all process types are running
   fly ps
   fly status
   ```

6. **Verify Worker Startup**

   ```bash
   # Check worker logs for successful startup
   fly logs --process notification-worker
   fly logs --process feed-worker

   # Look for these messages:
   # "Connected to Redis successfully"
   # "Worker started and listening for events..."
   ```

### Phase 4: Testing and Scaling

7. **Test Event Flow**

   ```bash
   # Test Redis connection from workers
   fly ssh console --process notification-worker
   node -e "const Redis = require('ioredis'); const r = new Redis(process.env.REDIS_URL); r.ping().then(console.log)"

   # Monitor Redis for job activity
   fly redis connect myapp-redis
   > MONITOR
   ```

8. **Scale Workers Based on Load**

   ```bash
   # Start conservative
   fly scale count notification-worker=1 feed-worker=2

   # Monitor and scale up as needed
   fly scale count notification-worker=2 feed-worker=3

   # Add regional distribution
   fly scale count notification-worker=1 --region ord
   fly scale count notification-worker=1 --region fra
   ```

### Phase 5: Monitoring and Optimization

9. **Set Up Monitoring**

   ```bash
   # Monitor worker health
   fly logs --process notification-worker --follow
   fly logs --process feed-worker --follow

   # Check Redis performance
   fly redis status myapp-redis
   fly redis dashboard myapp-redis
   ```

10. **Performance Optimization**

    ```bash
    # Monitor queue depths
    fly redis connect myapp-redis
    > LLEN bull:notifications:waiting
    > LLEN bull:feeds:waiting

    # Adjust scaling based on metrics
    fly scale count notification-worker=3  # If queue depth consistently high
    fly scale memory 1gb --process feed-worker  # If memory usage high
    ```

### Troubleshooting Common Issues

**Workers Not Starting:**

```bash
# Check for missing dependencies
fly logs --process notification-worker | grep "Error"

# Verify Redis connection
fly ssh console --process notification-worker
echo $REDIS_URL
```

**Jobs Not Processing:**

```bash
# Check if jobs are being queued
fly redis connect myapp-redis
> KEYS bull:*
> LLEN bull:notifications:waiting

# Verify worker registration
fly logs --process notification-worker | grep "subscribe"
```

**High Memory Usage:**

```bash
# Monitor resource usage
fly metrics --process notification-worker
fly metrics --process feed-worker

# Scale memory if needed
fly scale memory 1gb --process feed-worker
```

### Production Readiness Checklist

- ✅ Redis database with replicas in multiple regions
- ✅ Worker processes configured in `fly.toml`
- ✅ Environment variables properly set
- ✅ Workers successfully connecting to Redis
- ✅ Event handlers processing jobs
- ✅ Monitoring and logging in place
- ✅ Scaling strategy defined
- ✅ Error handling and retry logic tested

This comprehensive deployment guide ensures your distributed event system is properly configured and running on Fly.io with robust worker processes handling your social features at scale.
