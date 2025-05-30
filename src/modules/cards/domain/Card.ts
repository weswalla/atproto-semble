import { AggregateRoot } from "../../../shared/domain/AggregateRoot";
import { UniqueEntityID } from "../../../shared/domain/UniqueEntityID";
import { Result } from "../../../shared/core/Result";
import { CardId } from "./value-objects/CardId";
import { CardType } from "./value-objects/CardType";
import { CardContent } from "./value-objects/CardContent";
import { CuratorId } from "../../annotations/domain/value-objects/CuratorId";

interface CardProps {
  curatorId: CuratorId;
  type: CardType;
  content: CardContent;
  parentCardId?: CardId;
  createdAt: Date;
  updatedAt: Date;
}

export class Card extends AggregateRoot<CardProps> {
  get cardId(): CardId {
    return CardId.create(this._id).unwrap();
  }

  get curatorId(): CuratorId {
    return this.props.curatorId;
  }

  get type(): CardType {
    return this.props.type;
  }

  get content(): CardContent {
    return this.props.content;
  }

  get parentCardId(): CardId | undefined {
    return this.props.parentCardId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private constructor(props: CardProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: CardProps, id?: UniqueEntityID): Result<Card> {
    // Add validation logic here if needed
    return Result.ok<Card>(new Card(props, id));
  }
}
