import { EventName } from '../../infrastructure/events/EventConfig';
import { UniqueEntityID } from '../UniqueEntityID';

export interface IDomainEvent {
  eventName: EventName;
  dateTimeOccurred: Date;
  getAggregateId(): UniqueEntityID;
}
