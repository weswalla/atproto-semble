import { AggregateRoot } from "../../../shared/domain/AggregateRoot";
import { UniqueEntityID } from "../../../shared/domain/UniqueEntityID";
import { ok, err, Result } from "../../../shared/core/Result";
import { CardId } from "./value-objects/CardId";
import { CardType, CardTypeEnum } from "./value-objects/CardType";
import { CardContent } from "./value-objects/CardContent";
import { CuratorId } from "../../annotations/domain/value-objects/CuratorId";
import { PublishedRecordId } from "./value-objects/PublishedRecordId";
import { URL } from "./value-objects/URL";

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
  url?: URL;
  parentCardId?: CardId; // For NOTE and HIGHLIGHT cards that reference other cards
  publishedRecordId?: PublishedRecordId;
  libraryMemberships: Set<string>; // User IDs who have this card in their library
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

  get url(): URL | undefined {
    return this.props.url;
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

  get publishedRecordId(): PublishedRecordId | undefined {
    return this.props.publishedRecordId;
  }

  get isPublished(): boolean {
    return this.props.publishedRecordId !== undefined;
  }

  get libraryMemberships(): string[] {
    return Array.from(this.props.libraryMemberships);
  }

  get libraryMembershipCount(): number {
    return this.props.libraryMemberships.size;
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
      libraryMemberships: new Set<string>(),
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
      return err(new CardValidationError("URL cards cannot have parent cards"));
    }

    // URL cards must have a URL property
    if (props.type.value === CardTypeEnum.URL && !props.url) {
      return err(new CardValidationError("URL cards must have a url property"));
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

  public markAsPublished(publishedRecordId: PublishedRecordId): void {
    this.props.publishedRecordId = publishedRecordId;
    this.props.updatedAt = new Date();
  }

  public markAsUnpublished(): void {
    this.props.publishedRecordId = undefined;
    this.props.updatedAt = new Date();
  }

  public addToLibrary(userId: string): Result<void, CardValidationError> {
    if (!userId || userId.trim().length === 0) {
      return err(new CardValidationError("User ID cannot be empty"));
    }

    if (this.props.libraryMemberships.has(userId)) {
      return err(new CardValidationError("Card is already in user's library"));
    }

    this.props.libraryMemberships.add(userId);
    this.props.updatedAt = new Date();

    return ok(undefined);
  }

  public removeFromLibrary(userId: string): Result<void, CardValidationError> {
    if (!userId || userId.trim().length === 0) {
      return err(new CardValidationError("User ID cannot be empty"));
    }

    if (!this.props.libraryMemberships.has(userId)) {
      return err(new CardValidationError("Card is not in user's library"));
    }

    this.props.libraryMemberships.delete(userId);
    this.props.updatedAt = new Date();

    return ok(undefined);
  }

  public isInLibrary(userId: string): boolean {
    return this.props.libraryMemberships.has(userId);
  }

  public setLibraryMemberships(userIds: string[]): void {
    this.props.libraryMemberships = new Set(userIds);
    this.props.updatedAt = new Date();
  }
}
