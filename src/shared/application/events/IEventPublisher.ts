import { IDomainEvent } from '../../domain/events/IDomainEvent';
import { Result } from '../../core/Result';

export interface IEventPublisher {
  publishEvents(events: IDomainEvent[]): Promise<Result<void>>;
}
