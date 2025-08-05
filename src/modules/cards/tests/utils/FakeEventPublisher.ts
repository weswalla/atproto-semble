import { IEventPublisher } from '../../../../shared/application/events/IEventPublisher';
import { IDomainEvent } from '../../../../shared/domain/events/IDomainEvent';
import { Result, ok, err } from '../../../../shared/core/Result';
import { EventName } from 'src/shared/infrastructure/events/EventConfig';

export class FakeEventPublisher implements IEventPublisher {
  private publishedEvents: IDomainEvent[] = [];
  private shouldFail: boolean = false;

  async publishEvents(events: IDomainEvent[]): Promise<Result<void>> {
    if (this.shouldFail) {
      return err(new Error('Event publishing failed'));
    }

    this.publishedEvents.push(...events);
    return ok(undefined);
  }

  getPublishedEvents(): IDomainEvent[] {
    return [...this.publishedEvents];
  }

  getPublishedEventsOfType<T extends IDomainEvent>(eventType: EventName): T[] {
    return this.publishedEvents.filter(
      (event) => event.eventName === eventType,
    ) as T[];
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  clear(): void {
    this.publishedEvents = [];
    this.shouldFail = false;
  }
}
