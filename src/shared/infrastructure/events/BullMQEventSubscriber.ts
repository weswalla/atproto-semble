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
    const worker = new Worker(
      'events',
      async (job: Job) => {
        await this.processJob(job);
      },
      {
        connection: this.redisConnection,
        concurrency: 10,
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
