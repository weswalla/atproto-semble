import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import {
  IEventSubscriber,
  IEventHandler,
} from '../../application/events/IEventSubscriber';
import { IDomainEvent } from '../../domain/events/IDomainEvent';
import { QueueNames, QueueOptions, QueueName } from './QueueConfig';
import { EventMapper } from './EventMapper';
import { EventName } from './EventConfig';

export interface BullMQEventSubscriberConfig {
  queueName: QueueName;
  concurrency?: number;
}

export class BullMQEventSubscriber implements IEventSubscriber {
  private workers: Worker[] = [];
  private handlers: Map<EventName, IEventHandler<any>> = new Map();
  private config: BullMQEventSubscriberConfig;

  constructor(
    private redisConnection: Redis,
    config: BullMQEventSubscriberConfig,
  ) {
    this.config = config;
  }

  async subscribe<T extends IDomainEvent>(
    eventType: EventName,
    handler: IEventHandler<T>,
  ): Promise<void> {
    this.handlers.set(eventType, handler);
  }

  async start(): Promise<void> {
    const queueConfig = QueueOptions[this.config.queueName];
    const concurrency = this.config.concurrency || queueConfig.concurrency || 10;

    const worker = new Worker(
      this.config.queueName,
      async (job: Job) => {
        await this.processJob(job);
      },
      {
        connection: this.redisConnection,
        concurrency,
      },
    );

    worker.on('completed', (job) => {
      console.log(`[${this.config.queueName}] Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
      console.error(`[${this.config.queueName}] Job ${job?.id} failed:`, err);
    });

    worker.on('error', (err) => {
      console.error(`[${this.config.queueName}] Worker error:`, err);
    });

    this.workers.push(worker);
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
      console.warn(`[${this.config.queueName}] No handler registered for event type: ${eventType}`);
      return;
    }

    const event = this.reconstructEvent(eventData);
    const result = await handler.handle(event);

    if (result.isErr()) {
      throw result.error;
    }
  }

  private reconstructEvent(eventData: any): IDomainEvent {
    return EventMapper.fromSerialized(eventData);
  }
}
