import { IDomainEvent } from '../../domain/events/IDomainEvent';
import { Result } from '../../core/Result';

export interface IEventHandler<T extends IDomainEvent> {
  handle(event: T): Promise<Result<void>>;
}

export interface IEventSubscriber {
  subscribe<T extends IDomainEvent>(
    eventType: string,
    handler: IEventHandler<T>
  ): Promise<void>;
  
  start(): Promise<void>;
  stop(): Promise<void>;
}
