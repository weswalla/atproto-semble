import { IDomainEvent } from '../../../../shared/domain/events/IDomainEvent';
import { UniqueEntityID } from '../../../../shared/domain/UniqueEntityID';
import { CollectionId } from '../value-objects/CollectionId';
import { CuratorId } from '../value-objects/CuratorId';
import { EventNames } from '../../../../shared/infrastructure/events/EventConfig';
import { Result, ok } from '../../../../shared/core/Result';

export class CollectionCreatedEvent implements IDomainEvent {
  public readonly eventName = EventNames.COLLECTION_CREATED;
  public readonly dateTimeOccurred: Date;

  private constructor(
    public readonly collectionId: CollectionId,
    public readonly authorId: CuratorId,
    public readonly collectionName: string,
    dateTimeOccurred?: Date,
  ) {
    this.dateTimeOccurred = dateTimeOccurred || new Date();
  }

  public static create(
    collectionId: CollectionId,
    authorId: CuratorId,
    collectionName: string,
  ): Result<CollectionCreatedEvent> {
    return ok(new CollectionCreatedEvent(collectionId, authorId, collectionName));
  }

  public static reconstruct(
    collectionId: CollectionId,
    authorId: CuratorId,
    collectionName: string,
    dateTimeOccurred: Date,
  ): Result<CollectionCreatedEvent> {
    return ok(new CollectionCreatedEvent(collectionId, authorId, collectionName, dateTimeOccurred));
  }

  getAggregateId(): UniqueEntityID {
    return this.collectionId.getValue();
  }
}
