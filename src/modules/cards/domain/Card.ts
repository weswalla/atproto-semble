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

export interface CardInLibraryLink {
  curatorId: CuratorId;
  addedAt: Date;
  publishedRecordId?: PublishedRecordId; // AT URI of the link record
}

interface CardProps {
  type: CardType;
  content: CardContent;
  url?: URL;
  parentCardId?: CardId; // For NOTE and HIGHLIGHT cards that reference other cards
  libraryMemberships: CardInLibraryLink[]; // Set of users who have this card in their library
  originalPublishedRecordId?: PublishedRecordId; // The first published record ID for this card
  createdAt: Date;
  updatedAt: Date;
}

export class Card extends AggregateRoot<CardProps> {
  get cardId(): CardId {
    return CardId.create(this._id).unwrap();
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

  get libraryMemberships(): CardInLibraryLink[] {
    return Array.from(this.props.libraryMemberships);
  }

  get libraryMembershipCount(): number {
    return this.props.libraryMemberships.length;
  }

  get originalPublishedRecordId(): PublishedRecordId | undefined {
    return this.props.originalPublishedRecordId;
  }

  // Type-specific convenience getters
  get isUrlCard(): boolean {
    return this.props.type.value === CardTypeEnum.URL;
  }

  get isNoteCard(): boolean {
    return this.props.type.value === CardTypeEnum.NOTE;
  }

  private constructor(props: CardProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: Omit<CardProps, "createdAt" | "updatedAt" | "libraryMemberships"> & {
      libraryMemberships?: CardInLibraryLink[];
    },
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
      libraryMemberships: props.libraryMemberships || [],
      createdAt: now,
      updatedAt: now,
    };

    return ok(new Card(cardProps, id));
  }

  private static validateCardRelationships(
    props: Omit<CardProps, "createdAt" | "updatedAt" | "libraryMemberships"> & {
      libraryMemberships?: CardInLibraryLink[];
    }
  ): Result<void, CardValidationError> {
    // URL cards should not have parent cards
    if (props.type.value === CardTypeEnum.URL && props.parentCardId) {
      return err(new CardValidationError("URL cards cannot have parent cards"));
    }

    // URL cards must have a URL property
    if (props.type.value === CardTypeEnum.URL && !props.url) {
      return err(new CardValidationError("URL cards must have a url property"));
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

  public addToLibrary(userId: CuratorId): Result<void, CardValidationError> {
    if (
      this.props.libraryMemberships.find((link) =>
        link.curatorId.equals(userId)
      )
    ) {
      return err(new CardValidationError("Card is already in user's library"));
    }

    this.props.libraryMemberships.push({
      curatorId: userId,
      addedAt: new Date(),
    });
    this.props.updatedAt = new Date();

    return ok(undefined);
  }

  public removeFromLibrary(
    userId: CuratorId
  ): Result<void, CardValidationError> {
    if (
      !this.props.libraryMemberships.find((link) =>
        link.curatorId.equals(userId)
      )
    ) {
      return err(new CardValidationError("Card is not in user's library"));
    }

    this.props.libraryMemberships = this.props.libraryMemberships.filter(
      (link) => !link.curatorId.equals(userId)
    );
    this.props.updatedAt = new Date();

    return ok(undefined);
  }

  public isInLibrary(userId: CuratorId): boolean {
    return (
      this.props.libraryMemberships.find((link) =>
        link.curatorId.equals(userId)
      ) !== undefined
    );
  }

  public markCardInLibraryAsPublished(
    userId: CuratorId,
    publishedRecordId: PublishedRecordId
  ): Result<void, CardValidationError> {
    const membership = this.props.libraryMemberships.find((link) =>
      link.curatorId.equals(userId)
    );
    if (!membership) {
      return err(new CardValidationError("Card is not in user's library"));
    }

    membership.publishedRecordId = publishedRecordId;

    // Set the original published record ID if it hasn't been set yet
    if (!this.props.originalPublishedRecordId) {
      this.props.originalPublishedRecordId = publishedRecordId;
    }

    this.props.updatedAt = new Date();

    return ok(undefined);
  }

  public getLibraryInfo(userId: CuratorId): CardInLibraryLink | undefined {
    return this.props.libraryMemberships.find((link) =>
      link.curatorId.equals(userId)
    );
  }
}
