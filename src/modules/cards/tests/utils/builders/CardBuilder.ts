import { Card } from "../../../domain/Card";
import { CardType, CardTypeEnum } from "../../../domain/value-objects/CardType";
import {
  CardContent,
  HighlightSelector,
} from "../../../domain/value-objects/CardContent";
import { CardId } from "../../../domain/value-objects/CardId";
import { CuratorId } from "../../../../annotations/domain/value-objects/CuratorId";
import { URL } from "../../../domain/value-objects/URL";
import { UrlMetadata } from "../../../domain/value-objects/UrlMetadata";
import { PublishedRecordId } from "../../../domain/value-objects/PublishedRecordId";
import { UniqueEntityID } from "../../../../../shared/domain/UniqueEntityID";

export class CardBuilder {
  private _id?: UniqueEntityID;
  private _curatorId: string = "did:plc:defaultCurator";
  private _type: CardTypeEnum = CardTypeEnum.NOTE;
  private _content?: CardContent;
  private _url?: URL;
  private _parentCardId?: CardId;
  private _publishedRecordId?: PublishedRecordId;
  private _originalPublishedRecordId?: PublishedRecordId;
  private _createdAt?: Date;
  private _updatedAt?: Date;

  withId(id: UniqueEntityID): CardBuilder {
    this._id = id;
    return this;
  }

  withCuratorId(curatorId: string): CardBuilder {
    this._curatorId = curatorId;
    return this;
  }

  withUrl(url: URL): CardBuilder {
    this._url = url;
    return this;
  }

  withParentCard(parentCardId: CardId): CardBuilder {
    this._parentCardId = parentCardId;
    return this;
  }

  withPublishedRecordId(publishedRecordId: {
    uri: string;
    cid: string;
  }): CardBuilder {
    this._publishedRecordId = PublishedRecordId.create(publishedRecordId);
    return this;
  }

  withOriginalPublishedRecordId(originalPublishedRecordId: {
    uri: string;
    cid: string;
  }): CardBuilder {
    this._originalPublishedRecordId = PublishedRecordId.create(originalPublishedRecordId);
    return this;
  }

  withCreatedAt(createdAt: Date): CardBuilder {
    this._createdAt = createdAt;
    return this;
  }

  withUpdatedAt(updatedAt: Date): CardBuilder {
    this._updatedAt = updatedAt;
    return this;
  }

  // Specific card type builders
  withUrlCard(url: URL, metadata?: UrlMetadata): CardBuilder {
    this._type = CardTypeEnum.URL;
    this._url = url; // URL cards require the URL property
    const contentResult = CardContent.createUrlContent(url, metadata);
    if (contentResult.isErr()) {
      throw new Error(
        `Failed to create URL content: ${contentResult.error.message}`
      );
    }
    this._content = contentResult.value;
    return this;
  }

  withNoteCard(text: string, title?: string): CardBuilder {
    this._type = CardTypeEnum.NOTE;
    const contentResult = CardContent.createNoteContent(text, title);
    if (contentResult.isErr()) {
      throw new Error(
        `Failed to create note content: ${contentResult.error.message}`
      );
    }
    this._content = contentResult.value;
    return this;
  }

  withHighlightCard(
    text: string,
    selectors: HighlightSelector[],
    options?: {
      context?: string;
      documentUrl?: string;
      documentTitle?: string;
    }
  ): CardBuilder {
    this._type = CardTypeEnum.HIGHLIGHT;
    const contentResult = CardContent.createHighlightContent(
      text,
      selectors,
      options
    );
    if (contentResult.isErr()) {
      throw new Error(
        `Failed to create highlight content: ${contentResult.error.message}`
      );
    }
    this._content = contentResult.value;
    return this;
  }

  build(): Card | Error {
    try {
      if (!this._content) {
        return new Error("Card content is required");
      }

      const curatorIdResult = CuratorId.create(this._curatorId);
      if (curatorIdResult.isErr()) {
        return new Error(
          `Invalid curator ID: ${curatorIdResult.error.message}`
        );
      }

      const cardTypeResult = CardType.create(this._type);
      if (cardTypeResult.isErr()) {
        return new Error(`Invalid card type: ${cardTypeResult.error.message}`);
      }

      const cardResult = Card.create(
        {
          type: cardTypeResult.value,
          content: this._content,
          url: this._url,
          parentCardId: this._parentCardId,
          originalPublishedRecordId: this._originalPublishedRecordId,
        },
        this._id
      );

      if (cardResult.isErr()) {
        return cardResult.error;
      }

      const card = cardResult.value;

      // Set published record ID if provided
      if (this._publishedRecordId) {
        card.markAsPublished(this._publishedRecordId);
      }

      return card;
    } catch (error) {
      return error instanceof Error ? error : new Error(String(error));
    }
  }

  buildOrThrow(): Card {
    const result = this.build();
    if (result instanceof Error) {
      throw result;
    }
    return result;
  }
}
