import { AggregateRoot } from "../../../shared/domain/AggregateRoot";
import { UniqueEntityID } from "../../../shared/domain/UniqueEntityID";
import { ok, Result } from "../../../shared/core/Result";
import { CollectionId } from "./value-objects/CollectionId";
import { CardId } from "./value-objects/CardId";
import { CuratorId } from "../../annotations/domain/value-objects/CuratorId";

interface CollectionProps {
  curatorId: CuratorId;
  name: string;
  description?: string;
  cardIds: CardId[];
  createdAt: Date;
  updatedAt: Date;
}

export class Collection extends AggregateRoot<CollectionProps> {
  get collectionId(): CollectionId {
    return CollectionId.create(this._id).unwrap();
  }

  get curatorId(): CuratorId {
    return this.props.curatorId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get cardIds(): CardId[] {
    return this.props.cardIds;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
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

  public addCard(cardId: CardId): Result<void> {
    if (this.props.cardIds.some((id) => id.equals(cardId))) {
      return ok(undefined); // Card already in collection
    }

    this.props.cardIds.push(cardId);
    this.props.updatedAt = new Date();

    return ok(undefined);
  }

  public removeCard(cardId: CardId): Result<void> {
    this.props.cardIds = this.props.cardIds.filter((id) => !id.equals(cardId));
    this.props.updatedAt = new Date();

    return ok(undefined);
  }
}
