import { UniqueEntityID } from '../UniqueEntityID';

export interface IDomainEvent {
  dateTimeOccurred: Date;
  getAggregateId(): UniqueEntityID;
}

export interface IDomainEventClass {
  eventName: string;
}
