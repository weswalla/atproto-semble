import { IDomainEvent } from '../../../../shared/domain/events/IDomainEvent';
import { UniqueEntityID } from '../../../../shared/domain/UniqueEntityID';
import { CardId } from '../value-objects/CardId';
import { CuratorId } from '../value-objects/CuratorId';
import { EventNames } from '../../../../shared/infrastructure/events/EventConfig';

export class CardAddedToLibraryEvent implements IDomainEvent {
  public readonly eventName = EventNames.CARD_ADDED_TO_LIBRARY;
  public readonly dateTimeOccurred: Date;

  constructor(
    public readonly cardId: CardId,
    public readonly curatorId: CuratorId,
  ) {
    this.dateTimeOccurred = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.cardId.getValue();
  }
}
