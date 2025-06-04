import { err, ok, Result } from "../../../shared/core/Result";
import { Card, CardValidationError } from "./Card";
import { CardType, CardTypeEnum } from "./value-objects/CardType";
import { CardContent } from "./value-objects/CardContent";
import { CardId } from "./value-objects/CardId";
import { CuratorId } from "../../annotations/domain/value-objects/CuratorId";
import { URL } from "./value-objects/URL";
import { UrlMetadata } from "./value-objects/UrlMetadata";
import { HighlightSelector } from "./value-objects/content/HighlightCardContent";

// Define interfaces for the different card creation inputs
interface IUrlCardInput {
  type: CardTypeEnum.URL;
  url: string;
  metadata?: {
    title?: string;
    description?: string;
    author?: string;
    publishedDate?: Date;
    siteName?: string;
    imageUrl?: string;
    type?: string;
    retrievedAt: Date;
  };
}

interface INoteCardInput {
  type: CardTypeEnum.NOTE;
  text: string;
  title?: string;
  parentCardId?: string;
}

interface IHighlightCardInput {
  type: CardTypeEnum.HIGHLIGHT;
  text: string;
  selectors: HighlightSelector[];
  parentCardId: string;
  context?: string;
  documentUrl?: string;
  documentTitle?: string;
}

// Union type for all possible card creation inputs
export type CardCreationInput =
  | IUrlCardInput
  | INoteCardInput
  | IHighlightCardInput;

interface CreateCardProps {
  curatorId: string;
  cardInput: CardCreationInput;
}

export class CardFactory {
  static create(props: CreateCardProps): Result<Card, CardValidationError> {
    try {
      // Validate and create CuratorId
      const curatorIdResult = CuratorId.create(props.curatorId);
      if (curatorIdResult.isErr()) {
        return err(
          new CardValidationError(
            `Invalid curator ID: ${curatorIdResult.error.message}`
          )
        );
      }
      const curatorId = curatorIdResult.value;

      // Create CardType
      const cardTypeResult = CardType.create(props.cardInput.type);
      if (cardTypeResult.isErr()) {
        return err(
          new CardValidationError(
            `Invalid card type: ${cardTypeResult.error.message}`
          )
        );
      }
      const cardType = cardTypeResult.value;

      // Create CardContent based on type
      const contentResult = this.createCardContent(props.cardInput);
      if (contentResult.isErr()) {
        return err(contentResult.error);
      }
      const content = contentResult.value;

      // Create parent card ID if provided
      let parentCardId: CardId | undefined;
      if (this.hasParentCardId(props.cardInput)) {
        const parentCardIdResult = CardId.create(props.cardInput.parentCardId!);
        if (parentCardIdResult.isErr()) {
          return err(
            new CardValidationError(
              `Invalid parent card ID: ${parentCardIdResult.error.message}`
            )
          );
        }
        parentCardId = parentCardIdResult.value;
      }

      // Create the card
      return Card.create({
        curatorId,
        type: cardType,
        content,
        parentCardId,
      });
    } catch (error) {
      return err(
        new CardValidationError(
          error instanceof Error ? error.message : String(error)
        )
      );
    }
  }

  private static createCardContent(
    cardInput: CardCreationInput
  ): Result<CardContent, CardValidationError> {
    switch (cardInput.type) {
      case CardTypeEnum.URL:
        return this.createUrlContent(cardInput);

      case CardTypeEnum.NOTE:
        return this.createNoteContent(cardInput);

      case CardTypeEnum.HIGHLIGHT:
        return this.createHighlightContent(cardInput);

      default:
        return err(new CardValidationError("Invalid card type"));
    }
  }

  private static createUrlContent(
    input: IUrlCardInput
  ): Result<CardContent, CardValidationError> {
    // Create URL value object
    const urlResult = URL.create(input.url);
    if (urlResult.isErr()) {
      return err(
        new CardValidationError(`Invalid URL: ${urlResult.error.message}`)
      );
    }

    // Create UrlMetadata if provided
    let metadata: UrlMetadata | undefined;
    if (input.metadata) {
      const metadataResult = UrlMetadata.create({
        url: input.url,
        title: input.metadata.title,
        description: input.metadata.description,
        author: input.metadata.author,
        publishedDate: input.metadata.publishedDate,
        siteName: input.metadata.siteName,
        imageUrl: input.metadata.imageUrl,
        type: input.metadata.type,
        retrievedAt: input.metadata.retrievedAt,
      });
      if (metadataResult.isErr()) {
        return err(
          new CardValidationError(
            `Invalid metadata: ${metadataResult.error.message}`
          )
        );
      }
      metadata = metadataResult.value;
    }

    return CardContent.createUrlContent(urlResult.value, metadata);
  }

  private static createNoteContent(
    input: INoteCardInput
  ): Result<CardContent, CardValidationError> {
    return CardContent.createNoteContent(input.text, input.title);
  }

  private static createHighlightContent(
    input: IHighlightCardInput
  ): Result<CardContent, CardValidationError> {
    return CardContent.createHighlightContent(input.text, input.selectors, {
      context: input.context,
      documentUrl: input.documentUrl,
      documentTitle: input.documentTitle,
    });
  }

  // Type guards
  private static hasParentCardId(
    input: CardCreationInput
  ): input is INoteCardInput | IHighlightCardInput {
    return "parentCardId" in input && input.parentCardId !== undefined;
  }

  // Type guards for each card input type
  private static isUrlCardInput(input: any): input is IUrlCardInput {
    return input.type === CardTypeEnum.URL && typeof input.url === "string";
  }

  private static isNoteCardInput(input: any): input is INoteCardInput {
    return input.type === CardTypeEnum.NOTE && typeof input.text === "string";
  }

  private static isHighlightCardInput(
    input: any
  ): input is IHighlightCardInput {
    return (
      input.type === CardTypeEnum.HIGHLIGHT &&
      typeof input.text === "string" &&
      Array.isArray(input.selectors) &&
      typeof input.parentCardId === "string"
    );
  }
}
