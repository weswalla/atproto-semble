import { IDomainEvent } from 'src/shared/domain/events/IDomainEvent';
import { UniqueEntityID } from 'src/shared/domain/UniqueEntityID';
import { User } from '../User';

export class UserLoggedInEvent implements IDomainEvent {
  public dateTimeOccurred: Date;
  public user: User;

  constructor(user: User) {
    this.dateTimeOccurred = new Date();
    this.user = user;
  }

  getAggregateId(): UniqueEntityID {
    return this.user.userId;
  }
}
