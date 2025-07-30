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
