import { AggregateRoot } from "../../../shared/domain/AggregateRoot";
import { UniqueEntityID } from "../../../shared/domain/UniqueEntityID";
import { ok, err, Result } from "../../../shared/core/Result";
import { CollectionId } from "./value-objects/CollectionId";
import { CardId } from "./value-objects/CardId";
import { CuratorId } from "../../annotations/domain/value-objects/CuratorId";

export enum CollectionAccessType {
  OPEN = "OPEN",
  CLOSED = "CLOSED"
}

export class CollectionAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CollectionAccessError';
  }
}

interface CollectionProps {
  authorId: CuratorId;
  name: string;
  description?: string;
  accessType: CollectionAccessType;
  collaboratorIds: CuratorId[];
  cardIds: CardId[];
  createdAt: Date;
  updatedAt: Date;
}

export class Collection extends AggregateRoot<CollectionProps> {
  get collectionId(): CollectionId {
    return CollectionId.create(this._id).unwrap();
  }

  get authorId(): CuratorId {
    return this.props.authorId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get accessType(): CollectionAccessType {
    return this.props.accessType;
  }

  get collaboratorIds(): CuratorId[] {
    return [...this.props.collaboratorIds];
  }

  get cardIds(): CardId[] {
    return [...this.props.cardIds];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isOpen(): boolean {
    return this.props.accessType === CollectionAccessType.OPEN;
  }

  get isClosed(): boolean {
    return this.props.accessType === CollectionAccessType.CLOSED;
  }

  private constructor(props: CollectionProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: CollectionProps,
    id?: UniqueEntityID
  ): Result<Collection> {
    // Add validation logic here if needed
    return ok(new Collection(props, id));
  }

  public canAddCard(userId: CuratorId): boolean {
    // Author can always add cards
    if (this.props.authorId.equals(userId)) {
      return true;
    }

    // If collection is open, anyone can add cards
    if (this.isOpen) {
      return true;
    }

    // If collection is closed, only collaborators can add cards
    return this.props.collaboratorIds.some(collaboratorId => collaboratorId.equals(userId));
  }

  public addCard(cardId: CardId, userId: CuratorId): Result<void, CollectionAccessError> {
    if (!this.canAddCard(userId)) {
      return err(new CollectionAccessError("User does not have permission to add cards to this collection"));
    }

    if (this.props.cardIds.some((id) => id.equals(cardId))) {
      return ok(undefined); // Card already in collection
    }

    this.props.cardIds.push(cardId);
    this.props.updatedAt = new Date();

    return ok(undefined);
  }

  public removeCard(cardId: CardId, userId: CuratorId): Result<void, CollectionAccessError> {
    if (!this.canAddCard(userId)) {
      return err(new CollectionAccessError("User does not have permission to remove cards from this collection"));
    }

    this.props.cardIds = this.props.cardIds.filter((id) => !id.equals(cardId));
    this.props.updatedAt = new Date();

    return ok(undefined);
  }

  public addCollaborator(collaboratorId: CuratorId, userId: CuratorId): Result<void, CollectionAccessError> {
    if (!this.props.authorId.equals(userId)) {
      return err(new CollectionAccessError("Only the author can add collaborators"));
    }

    if (this.props.collaboratorIds.some(id => id.equals(collaboratorId))) {
      return ok(undefined); // Already a collaborator
    }

    this.props.collaboratorIds.push(collaboratorId);
    this.props.updatedAt = new Date();

    return ok(undefined);
  }

  public removeCollaborator(collaboratorId: CuratorId, userId: CuratorId): Result<void, CollectionAccessError> {
    if (!this.props.authorId.equals(userId)) {
      return err(new CollectionAccessError("Only the author can remove collaborators"));
    }

    this.props.collaboratorIds = this.props.collaboratorIds.filter(id => !id.equals(collaboratorId));
    this.props.updatedAt = new Date();

    return ok(undefined);
  }

  public changeAccessType(accessType: CollectionAccessType, userId: CuratorId): Result<void, CollectionAccessError> {
    if (!this.props.authorId.equals(userId)) {
      return err(new CollectionAccessError("Only the author can change collection access type"));
    }

    this.props.accessType = accessType;
    this.props.updatedAt = new Date();

    return ok(undefined);
  }
}
