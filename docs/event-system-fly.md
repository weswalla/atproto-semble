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

| Aspect | Web Process | Worker Process |
|--------|-------------|----------------|
| **Trigger** | HTTP Request | Redis Job Available |
| **Lifecycle** | Request/Response | Long-running polling |
| **Scaling** | Scale with traffic | Scale with queue depth |
| **Failure** | Return error to user | Retry job automatically |
| **Dependencies** | Database, Redis | Database, External APIs |

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
      this.queues.set(queueConfig.name, new Queue(queueConfig.name, {
        connection: this.redisConnection,
        defaultJobOptions: queueConfig.options,
      }));
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
        }
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
      }
    };
  }

  async close(): Promise<void> {
    await Promise.all(
      Array.from(this.queues.values()).map(queue => queue.close())
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
import { IEventSubscriber, IEventHandler } from '../../application/events/IEventSubscriber';
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
    handler: IEventHandler<T>
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
        }
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
    await Promise.all(this.workers.map(worker => worker.close()));
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
    DomainEvents.register(
      async (event: CardAddedToLibraryEvent) => {
        try {
          await this.eventPublisher.publishEvents([event]);
        } catch (error) {
          console.error('Error publishing event to BullMQ:', error);
          // Don't fail the main operation if event publishing fails
        }
      },
      CardAddedToLibraryEvent.name,
    );
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

#### Configure fly.toml

```toml
# fly.toml
app = "myapp"

[build]
  dockerfile = "Dockerfile"

[processes]
  web = "npm start"
  notification-worker = "npm run worker:notifications"
  feed-worker = "npm run worker:feeds"

[env]
  NODE_ENV = "production"
  # Redis URL will be automatically set by Fly when you attach the Redis database
  # You can also set it manually if needed:
  # REDIS_URL = "redis://default:password@fly-myapp-redis.upstash.io:6379"

[[services]]
  internal_port = 8080
  protocol = "tcp"
  
  [[services.ports]]
    port = 80
    handlers = ["http"]
  
  [[services.ports]]
    port = 443
    handlers = ["http", "tls"]

[deploy]
  strategy = "rolling"
```

#### Create Worker Scripts

```json
// package.json
{
  "scripts": {
    "worker:notifications": "node dist/workers/notification-worker.js",
    "worker:feeds": "node dist/workers/feed-worker.js"
  }
}
```

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
  const notificationHandler = new CardAddedToLibraryEventHandler(notificationService);
  
  // Register handlers
  await eventSubscriber.subscribe('CardAddedToLibraryEvent', notificationHandler);
  
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

export class AddCardToLibraryUseCase extends BaseUseCase<AddCardToLibraryRequest, Result<void>> {
  constructor(
    private cardRepository: ICardRepository,
    eventPublisher: IEventPublisher,
  ) {
    super(eventPublisher);
  }

  async execute(request: AddCardToLibraryRequest): Promise<Result<void>> {
    // 1. Get the card
    const cardResult = await this.cardRepository.findById(CardId.create(request.cardId).unwrap());
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

### Initial Deployment

```bash
# First, create your Redis database
fly redis create --name myapp-redis --region ord --replica-regions fra,iad

# Attach the Redis database to your app (this sets the REDIS_URL environment variable)
fly redis attach myapp-redis

# Deploy the application
fly deploy

# Scale workers based on expected load
fly scale count web=2 notification-worker=2 feed-worker=3

# Add workers to multiple regions for better performance
fly regions add notification-worker fra ord
fly regions add feed-worker fra ord
```

### Deployment Process Differences

#### Web Process Deployment
- **Trigger**: `fly deploy` command
- **Process**: Standard web server deployment
- **Dependencies**: Database, Redis (for publishing)
- **Health Check**: HTTP endpoint availability
- **Scaling**: Based on HTTP traffic

#### Worker Process Deployment
- **Trigger**: Same `fly deploy` command (different process type)
- **Process**: Long-running background process
- **Dependencies**: Redis (for consuming), Database, External APIs
- **Health Check**: Process running + Redis connectivity
- **Scaling**: Based on queue depth and processing time

#### Key Deployment Considerations

1. **Redis Must Be Available First**
   ```bash
   # Redis must be created and attached before deploying workers
   fly redis create --name myapp-redis
   fly redis attach myapp-redis
   # Then deploy
   fly deploy
   ```

2. **Worker Dependencies**
   - Workers need access to the same database as web processes
   - Workers need Redis connectivity for job consumption
   - Workers may need external API access (notifications, etc.)

3. **Environment Variables**
   ```bash
   # Check that workers have access to required env vars
   fly ssh console --process notification-worker
   echo $REDIS_URL
   echo $DATABASE_URL
   ```

4. **Process Health Monitoring**
   ```bash
   # Monitor worker processes
   fly logs --process notification-worker
   fly logs --process feed-worker
   
   # Check process status
   fly status
   ```

### Scaling Guidelines

**For Notifications (External API calls):**
- Start with 2-3 workers
- Lower concurrency (5-10 jobs per worker)
- Monitor external API rate limits
- Scale based on queue depth and processing time

**For Feeds (Database operations):**
- Start with 3-5 workers
- Higher concurrency (10-20 jobs per worker)
- Scale based on database performance
- Monitor for database connection limits

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
  queues: [
    new BullMQAdapter(notificationQueue),
    new BullMQAdapter(feedQueue),
  ],
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
      const avgTime = times.length > 0 
        ? times.reduce((a, b) => a + b, 0) / times.length 
        : 0;

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

    const event = new CardAddedToLibraryEvent(cardId, curatorId, CardTypeEnum.URL);
    await publisher.publish(event);

    expect(mockQueue.add).toHaveBeenCalledWith(
      'CardAddedToLibraryEvent',
      expect.objectContaining({
        cardId,
        curatorId,
        cardType: CardTypeEnum.URL,
      })
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
    const event = new CardAddedToLibraryEvent(cardId, curatorId, CardTypeEnum.URL);
    await eventPublisher.publish(event);

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify handler was called
    expect(mockNotificationHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        cardId,
        curatorId,
        cardType: CardTypeEnum.URL,
      })
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
    removeOnComplete: 100,  // Keep successful jobs for debugging
    removeOnFail: 50,       // Keep failed jobs for analysis
    attempts: 3,            // Retry failed jobs
    backoff: {
      type: 'exponential',
      delay: 2000,          // Start with 2s delay
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

## Next Steps

1. **Deploy Redis**: Set up your Upstash Redis database via Fly
   ```bash
   fly redis create --name myapp-redis --region ord --replica-regions fra,iad
   fly redis attach myapp-redis
   ```

2. **Implement Publisher**: Add BullMQ event publisher to your service factory

3. **Create Workers**: Deploy notification and feed workers

4. **Test Integration**: Verify events flow from domain to workers
   ```bash
   # Test Redis connection
   fly redis connect myapp-redis
   
   # Monitor worker logs
   fly logs --process notification-worker
   ```

5. **Monitor Performance**: Set up dashboards and alerts
   ```bash
   # Check Redis metrics
   fly redis status myapp-redis
   
   # View Redis dashboard
   fly redis dashboard myapp-redis
   ```

6. **Scale Gradually**: Start with minimal workers and scale based on load
   ```bash
   # Scale Redis if needed
   fly redis update myapp-redis --plan <higher-tier-plan>
   
   # Scale workers
   fly scale count notification-worker=5 feed-worker=8
   ```

This implementation provides a robust, scalable foundation for handling high-frequency social events while maintaining the clean architecture principles of your DDD system.
