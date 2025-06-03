import { AggregateRoot } from "../../../shared/domain/AggregateRoot";
import { UniqueEntityID } from "../../../shared/domain/UniqueEntityID";
import { ok, err, Result } from "../../../shared/core/Result";
import { CardId } from "./value-objects/CardId";
import { CardType, CardTypeEnum } from "./value-objects/CardType";
import { CardContent } from "./value-objects/CardContent";
import { CuratorId } from "../../annotations/domain/value-objects/CuratorId";

export class CardValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CardValidationError";
  }
}

interface CardProps {
  curatorId: CuratorId;
  type: CardType;
  content: CardContent;
  parentCardId?: CardId; // For NOTE and HIGHLIGHT cards that reference other cards
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

  // Type-specific convenience getters
  get isUrlCard(): boolean {
    return this.props.type.value === CardTypeEnum.URL;
  }

  get isNoteCard(): boolean {
    return this.props.type.value === CardTypeEnum.NOTE;
  }

  get isHighlightCard(): boolean {
    return this.props.type.value === CardTypeEnum.HIGHLIGHT;
  }

  get isStandaloneNote(): boolean {
    return this.isNoteCard && !this.props.parentCardId;
  }

  get isLinkedNote(): boolean {
    return this.isNoteCard && !!this.props.parentCardId;
  }

  private constructor(props: CardProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: Omit<CardProps, "createdAt" | "updatedAt">,
    id?: UniqueEntityID
  ): Result<Card, CardValidationError> {
    // Validate content type matches card type
    if (props.type.value !== props.content.type) {
      return err(new CardValidationError("Card type must match content type"));
    }

    // Validate parent/source card relationships
    const validationResult = Card.validateCardRelationships(props);
    if (validationResult.isErr()) {
      return err(validationResult.error);
    }

    const now = new Date();
    const cardProps: CardProps = {
      ...props,
      createdAt: now,
      updatedAt: now,
    };

    return ok(new Card(cardProps, id));
  }

  private static validateCardRelationships(
    props: Omit<CardProps, "createdAt" | "updatedAt">
  ): Result<void, CardValidationError> {
    // URL cards should not have parent cards
    if (props.type.value === CardTypeEnum.URL && props.parentCardId) {
      return err(
        new CardValidationError("URL cards cannot have parent cards")
      );
    }

    // HIGHLIGHT cards should have a parent card (the content being highlighted)
    if (props.type.value === CardTypeEnum.HIGHLIGHT && !props.parentCardId) {
      return err(
        new CardValidationError("Highlight cards must have a parent card")
      );
    }

    return ok(undefined);
  }

  public updateContent(
    newContent: CardContent
  ): Result<void, CardValidationError> {
    if (this.props.type.value !== newContent.type) {
      return err(
        new CardValidationError("Cannot change card content to different type")
      );
    }

    this.props.content = newContent;
    this.props.updatedAt = new Date();

    return ok(undefined);
  }
}
