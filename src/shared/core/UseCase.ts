import { IEventPublisher } from '../application/events/IEventPublisher';
import { DomainEvents } from '../domain/events/DomainEvents';
import { AggregateRoot } from '../domain/AggregateRoot';
import { Result, ok } from './Result';

export interface UseCase<IRequest, IResponse> {
  execute(request?: IRequest): Promise<IResponse> | IResponse;
}

export abstract class BaseUseCase<IRequest, IResponse> implements UseCase<IRequest, IResponse> {
  constructor(protected eventPublisher: IEventPublisher) {}

  abstract execute(request?: IRequest): Promise<IResponse> | IResponse;

  protected async publishEventsForAggregate(
    aggregate: AggregateRoot<any>
  ): Promise<Result<void>> {
    const events = DomainEvents.getEventsForAggregate(aggregate.id);
    
    if (events.length === 0) {
      return ok(undefined);
    }

    const publishResult = await this.eventPublisher.publishEvents(events);
    
    if (publishResult.isOk()) {
      DomainEvents.clearEventsForAggregate(aggregate.id);
    }
    
    return publishResult;
  }
}
