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

  private async handleDistributedEvent(
    eventName: string,
    eventData: any,
  ): Promise<void> {
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

  private async handleDistributedEvent(
    eventType: string,
    eventData: any,
  ): Promise<void> {
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

  async saveEvent(
    event: IDomainEvent,
    aggregateId: string,
  ): Promise<Result<void>> {
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

  private async dispatchEvent(
    eventType: string,
    eventData: any,
  ): Promise<void> {
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

    const eventData = Buffer.from(
      JSON.stringify({
        ...event,
        aggregateId: event.getAggregateId().toString(),
      }),
    );

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
    super(
      feedsCardAddedToLibraryHandler,
      notificationsCardAddedToLibraryHandler,
    );
  }

  registerAllHandlers(): void {
    // Register local handlers (existing logic)
    super.registerAllHandlers();

    // If we have a distributed publisher, also publish events
    if (this.eventPublisher) {
      DomainEvents.register(async (event: CardAddedToLibraryEvent) => {
        await this.eventPublisher!.publish(event);
      }, CardAddedToLibraryEvent.name);
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
