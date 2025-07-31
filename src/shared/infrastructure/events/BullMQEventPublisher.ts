import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { IEventPublisher } from '../../application/events/IEventPublisher';
import { IDomainEvent } from '../../domain/events/IDomainEvent';
import { Result, ok, err } from '../../core/Result';
import { QueueNames, QueueOptions } from './QueueConfig';
import { EventMapper } from './EventMapper';

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
    if (!this.queues.has(QueueNames.EVENTS)) {
      this.queues.set(
        QueueNames.EVENTS,
        new Queue(QueueNames.EVENTS, {
          connection: this.redisConnection,
          defaultJobOptions: QueueOptions[QueueNames.EVENTS],
        }),
      );
    }

    const queue = this.queues.get(QueueNames.EVENTS)!;
    const serializedEvent = EventMapper.toSerialized(event);
    await queue.add(serializedEvent.eventType, serializedEvent);
  }


  async close(): Promise<void> {
    await Promise.all(
      Array.from(this.queues.values()).map((queue) => queue.close()),
    );
  }
}
