import { Entity } from '../../../shared/domain/Entity';
import { UniqueEntityID } from '../../../shared/domain/UniqueEntityID';
import { Result, ok, err } from '../../../shared/core/Result';
import { ActivityId } from './value-objects/ActivityId';
import { ActivityType, ActivityTypeEnum } from './value-objects/ActivityType';
import { CuratorId } from '../../cards/domain/value-objects/CuratorId';
import { CardId } from '../../cards/domain/value-objects/CardId';
import { CollectionId } from '../../cards/domain/value-objects/CollectionId';

export class ActivityValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActivityValidationError';
  }
}

// Activity metadata for different activity types
export interface CardAddedToLibraryMetadata {
  cardId: string;
  cardTitle?: string;
  cardUrl?: string;
}

export interface CardAddedToCollectionMetadata {
  cardId: string;
  cardTitle?: string;
  cardUrl?: string;
  collectionIds: string[];
  collectionNames: string[];
}

export type ActivityMetadata = 
  | CardAddedToLibraryMetadata 
  | CardAddedToCollectionMetadata;

interface ActivityProps {
  actorId: CuratorId; // The user who performed the activity
  type: ActivityType;
  metadata: ActivityMetadata;
  createdAt: Date;
}

export class Activity extends Entity<ActivityProps> {
  get activityId(): ActivityId {
    return ActivityId.create(this._id).unwrap();
  }

  get actorId(): CuratorId {
    return this.props.actorId;
  }

  get type(): ActivityType {
    return this.props.type;
  }

  get metadata(): ActivityMetadata {
    return this.props.metadata;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Type guards for metadata
  get isCardAddedToLibrary(): boolean {
    return this.props.type.value === ActivityTypeEnum.CARD_ADDED_TO_LIBRARY;
  }

  get isCardAddedToCollection(): boolean {
    return this.props.type.value === ActivityTypeEnum.CARD_ADDED_TO_COLLECTION;
  }

  get cardAddedToLibraryMetadata(): CardAddedToLibraryMetadata | null {
    return this.isCardAddedToLibrary ? this.props.metadata as CardAddedToLibraryMetadata : null;
  }

  get cardAddedToCollectionMetadata(): CardAddedToCollectionMetadata | null {
    return this.isCardAddedToCollection ? this.props.metadata as CardAddedToCollectionMetadata : null;
  }

  private constructor(props: ActivityProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static createCardAddedToLibrary(
    actorId: CuratorId,
    cardId: CardId,
    cardTitle?: string,
    cardUrl?: string,
    createdAt?: Date,
    id?: UniqueEntityID,
  ): Result<Activity, ActivityValidationError> {
    const typeResult = ActivityType.cardAddedToLibrary();
    if (typeResult.isErr()) {
      return err(new ActivityValidationError(typeResult.error.message));
    }

    const metadata: CardAddedToLibraryMetadata = {
      cardId: cardId.getStringValue(),
      cardTitle,
      cardUrl,
    };

    const props: ActivityProps = {
      actorId,
      type: typeResult.value,
      metadata,
      createdAt: createdAt || new Date(),
    };

    return ok(new Activity(props, id));
  }

  public static createCardAddedToCollection(
    actorId: CuratorId,
    cardId: CardId,
    collectionIds: CollectionId[],
    collectionNames: string[],
    cardTitle?: string,
    cardUrl?: string,
    createdAt?: Date,
    id?: UniqueEntityID,
  ): Result<Activity, ActivityValidationError> {
    if (collectionIds.length !== collectionNames.length) {
      return err(new ActivityValidationError('Collection IDs and names arrays must have the same length'));
    }

    if (collectionIds.length === 0) {
      return err(new ActivityValidationError('At least one collection must be specified'));
    }

    const typeResult = ActivityType.cardAddedToCollection();
    if (typeResult.isErr()) {
      return err(new ActivityValidationError(typeResult.error.message));
    }

    const metadata: CardAddedToCollectionMetadata = {
      cardId: cardId.getStringValue(),
      cardTitle,
      cardUrl,
      collectionIds: collectionIds.map(id => id.getStringValue()),
      collectionNames,
    };

    const props: ActivityProps = {
      actorId,
      type: typeResult.value,
      metadata,
      createdAt: createdAt || new Date(),
    };

    return ok(new Activity(props, id));
  }
}
