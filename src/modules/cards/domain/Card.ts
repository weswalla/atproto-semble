import { AggregateRoot } from "../../../shared/domain/AggregateRoot";
import { UniqueEntityID } from "../../../shared/domain/UniqueEntityID";
import { ok, err, Result } from "../../../shared/core/Result";
import { CardId } from "./value-objects/CardId";
import { CardType, CardTypeEnum } from "./value-objects/CardType";
import { CardContent, CardContentValidationError } from "./value-objects/CardContent";
import { CuratorId } from "../../annotations/domain/value-objects/CuratorId";

export class CardValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CardValidationError';
  }
}

interface CardProps {
  curatorId: CuratorId;
  type: CardType;
  content: CardContent;
  parentCardId?: CardId; // For NOTE and HIGHLIGHT cards that reference other cards
  sourceCardId?: CardId; // For HIGHLIGHT cards that reference the original content
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

  get sourceCardId(): CardId | undefined {
    return this.props.sourceCardId;
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
    return this.isNoteCard && !this.props.parentCardId && !this.props.sourceCardId;
  }

  get isLinkedNote(): boolean {
    return this.isNoteCard && (!!this.props.parentCardId || !!this.props.sourceCardId);
  }

  private constructor(props: CardProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: Omit<CardProps, 'createdAt' | 'updatedAt'>, 
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
      updatedAt: now
    };

    return ok(new Card(cardProps, id));
  }

  private static validateCardRelationships(
    props: Omit<CardProps, 'createdAt' | 'updatedAt'>
  ): Result<void, CardValidationError> {
    // URL cards should not have parent or source cards
    if (props.type.value === CardTypeEnum.URL && (props.parentCardId || props.sourceCardId)) {
      return err(new CardValidationError("URL cards cannot have parent or source cards"));
    }

    // HIGHLIGHT cards should have a source card (the content being highlighted)
    if (props.type.value === CardTypeEnum.HIGHLIGHT && !props.sourceCardId) {
      return err(new CardValidationError("Highlight cards must have a source card"));
    }

    // NOTE cards can have either parentCardId OR sourceCardId, but not both
    if (props.type.value === CardTypeEnum.NOTE && props.parentCardId && props.sourceCardId) {
      return err(new CardValidationError("Note cards cannot have both parent and source cards"));
    }

    return ok(undefined);
  }

  public updateContent(newContent: CardContent): Result<void, CardValidationError> {
    if (this.props.type.value !== newContent.type) {
      return err(new CardValidationError("Cannot change card content to different type"));
    }

    this.props.content = newContent;
    this.props.updatedAt = new Date();

    return ok(undefined);
  }
}
