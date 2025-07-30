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

## Implementation Guide

### Step 1: Install Dependencies

```bash
npm install bullmq ioredis
npm install --save-dev @types/ioredis
```

### Step 2: Infrastructure Layer - Event Publisher

Create the BullMQ event publisher that integrates with your existing domain events:

```typescript
// src/shared/infrastructure/events/BullMQEventPublisher.ts
import { Queue, ConnectionOptions } from 'bullmq';
import { IDomainEvent } from '../../domain/events/IDomainEvent';
import { CardAddedToLibraryEvent } from '../../../modules/cards/domain/events/CardAddedToLibraryEvent';

export class BullMQEventPublisher {
  private queues: Map<string, Queue> = new Map();

  constructor(private redisConnection: ConnectionOptions) {}

  async publish(event: IDomainEvent): Promise<void> {
    // Route different events to appropriate queues
    const queueConfig = this.getQueueConfig(event);
    
    if (!this.queues.has(queueConfig.name)) {
      this.queues.set(queueConfig.name, new Queue(queueConfig.name, {
        connection: this.redisConnection,
        defaultJobOptions: queueConfig.options,
      }));
    }

    const queue = this.queues.get(queueConfig.name)!;
    await queue.add(event.constructor.name, {
      ...event,
      aggregateId: event.getAggregateId().toString(),
      dateTimeOccurred: event.dateTimeOccurred.toISOString(),
    });
  }

  private getQueueConfig(event: IDomainEvent) {
    // Configure different queues for different event types
    if (event instanceof CardAddedToLibraryEvent) {
      return {
        name: 'notifications',
        options: {
          priority: 1, // High priority for notifications
          attempts: 5,
          backoff: { type: 'exponential' as const, delay: 1000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        }
      };
    }

    // Default queue configuration
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

### Step 3: Infrastructure Layer - Event Workers

Create specialized workers for different types of event processing:

```typescript
// src/shared/infrastructure/events/BullMQEventWorker.ts
import { Worker, Job } from 'bullmq';
import { ConnectionOptions } from 'ioredis';
import { CardAddedToLibraryEvent } from '../../../modules/cards/domain/events/CardAddedToLibraryEvent';
import { CardId } from '../../../modules/cards/domain/value-objects/CardId';
import { CuratorId } from '../../../modules/cards/domain/value-objects/CuratorId';
import { CardTypeEnum } from '../../../modules/cards/domain/value-objects/CardType';

export class BullMQEventWorker {
  private workers: Worker[] = [];

  constructor(
    private redisConnection: ConnectionOptions,
    private notificationHandler: any, // Your notification event handler
    private feedHandler: any, // Your feed event handler
  ) {}

  async startWorkers(): Promise<void> {
    // Notification worker - high priority, lower concurrency for external API calls
    const notificationWorker = new Worker(
      'notifications',
      async (job: Job) => {
        await this.processNotificationEvent(job);
      },
      {
        connection: this.redisConnection,
        concurrency: 5, // Conservative for external API calls
        limiter: {
          max: 100, // Max 100 notifications per minute
          duration: 60000,
        },
      }
    );

    // Feed worker - lower priority, higher concurrency for DB operations
    const feedWorker = new Worker(
      'feeds',
      async (job: Job) => {
        await this.processFeedEvent(job);
      },
      {
        connection: this.redisConnection,
        concurrency: 15, // Higher concurrency for DB operations
      }
    );

    this.workers.push(notificationWorker, feedWorker);

    // Set up error handling
    this.workers.forEach(worker => {
      worker.on('completed', (job) => {
        console.log(`Job ${job.id} completed successfully`);
      });

      worker.on('failed', (job, err) => {
        console.error(`Job ${job?.id} failed:`, err);
      });

      worker.on('error', (err) => {
        console.error('Worker error:', err);
      });
    });
  }

  private async processNotificationEvent(job: Job): Promise<void> {
    const eventData = job.data;
    
    // Reconstruct the domain event
    const event = this.reconstructEvent(eventData);
    
    if (event instanceof CardAddedToLibraryEvent) {
      await this.notificationHandler.handle(event);
    }
  }

  private async processFeedEvent(job: Job): Promise<void> {
    const eventData = job.data;
    
    // Reconstruct the domain event
    const event = this.reconstructEvent(eventData);
    
    if (event instanceof CardAddedToLibraryEvent) {
      await this.feedHandler.handle(event);
    }
  }

  private reconstructEvent(eventData: any): IDomainEvent {
    // Reconstruct domain events from serialized data
    if (eventData.constructor?.name === 'CardAddedToLibraryEvent' || 
        eventData.eventType === 'CardAddedToLibraryEvent') {
      
      const cardId = CardId.create(eventData.cardId.value).unwrap();
      const curatorId = CuratorId.create(eventData.curatorId.value).unwrap();
      
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

    throw new Error(`Unknown event type: ${eventData.constructor?.name}`);
  }

  async close(): Promise<void> {
    await Promise.all(this.workers.map(worker => worker.close()));
  }
}
```

### Step 4: Update Event Handler Registry

Extend your existing registry to support distributed events:

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
    // Register local handlers (existing logic)
    super.registerAllHandlers();

    // Register distributed event publishing
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

### Step 5: Fly.io Infrastructure Setup

#### Set up Redis/Valkey

```bash
# Create a Valkey instance (recommended over Redis)
fly redis create --name myapp-valkey --region ord

# Or use Upstash Redis
fly ext redis create --name myapp-redis
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
  REDIS_URL = "redis://myapp-valkey.internal:6379"

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
import { createRedisConnection } from '../shared/infrastructure/redis/RedisConnection';
import { BullMQEventWorker } from '../shared/infrastructure/events/BullMQEventWorker';
import { ServiceFactory } from '../shared/infrastructure/ServiceFactory';

async function startNotificationWorker() {
  const redisConnection = createRedisConnection();
  const services = ServiceFactory.create();
  
  const worker = new BullMQEventWorker(
    redisConnection,
    services.notificationsCardAddedToLibraryHandler,
    null // No feed handler for notification worker
  );

  await worker.startWorkers();
  
  console.log('Notification worker started');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down notification worker...');
    await worker.close();
    process.exit(0);
  });
}

startNotificationWorker().catch(console.error);
```

### Step 6: Service Factory Integration

Update your service factory to use the distributed event system:

```typescript
// In your ServiceFactory
export class ServiceFactory {
  static create(
    configService: EnvironmentConfigService,
    repositories: Repositories,
  ): Services {
    // ... existing services

    // Redis connection
    const redisConnection = {
      host: configService.get('REDIS_HOST') || 'localhost',
      port: parseInt(configService.get('REDIS_PORT') || '6379'),
      password: configService.get('REDIS_PASSWORD'),
    };

    // Event publisher
    const eventPublisher = new BullMQEventPublisher(redisConnection);

    // Distributed event handler registry
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

## Deployment Strategy

### Initial Deployment

```bash
# Deploy the application
fly deploy

# Scale workers based on expected load
fly scale count web=2 notification-worker=2 feed-worker=3

# Add workers to multiple regions for better performance
fly regions add notification-worker fra ord
fly regions add feed-worker fra ord
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
fly redis connect myapp-valkey
> MONITOR

# Check queue status
fly ssh console --app myapp
> npm run queue:status
```

## Next Steps

1. **Deploy Redis/Valkey**: Set up your message broker infrastructure
2. **Implement Publisher**: Add BullMQ event publisher to your service factory
3. **Create Workers**: Deploy notification and feed workers
4. **Test Integration**: Verify events flow from domain to workers
5. **Monitor Performance**: Set up dashboards and alerts
6. **Scale Gradually**: Start with minimal workers and scale based on load

This implementation provides a robust, scalable foundation for handling high-frequency social events while maintaining the clean architecture principles of your DDD system.
