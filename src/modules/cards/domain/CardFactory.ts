import { err, ok, Result } from "../../../shared/core/Result";
import { Card, CardValidationError } from "./Card";
import { CardType, CardTypeEnum } from "./value-objects/CardType";
import { CardContent } from "./value-objects/CardContent";
import { CardId } from "./value-objects/CardId";
import { CuratorId } from "../../annotations/domain/value-objects/CuratorId";
import { URL } from "./value-objects/URL";
import { UrlMetadata } from "./value-objects/UrlMetadata";
import { HighlightSelector } from "./value-objects/content/HighlightCardContent";
import { IMetadataService } from "./services/IMetadataService";

// Define interfaces for the different card creation inputs
interface IUrlCardInput {
  type: CardTypeEnum.URL;
  url: string;
  metadata?: UrlMetadata;
}

interface INoteCardInput {
  type: CardTypeEnum.NOTE;
  text: string;
  title?: string;
  parentCardId?: string;
  url?: string;
}

interface IHighlightCardInput {
  type: CardTypeEnum.HIGHLIGHT;
  text: string;
  selectors: HighlightSelector[];
  parentCardId: string;
  context?: string;
  documentUrl?: string;
  documentTitle?: string;
  url?: string;
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
        const parentCardIdResult = CardId.createFromString(
          props.cardInput.parentCardId!
        );
        if (parentCardIdResult.isErr()) {
          return err(
            new CardValidationError(
              `Invalid parent card ID: ${parentCardIdResult.error.message}`
            )
          );
        }
        parentCardId = parentCardIdResult.value;
      }

      // Create URL if provided for URL cards (required) or optional for other card types
      let url: URL | undefined;
      if (props.cardInput.type === CardTypeEnum.URL) {
        const urlResult = URL.create(props.cardInput.url);
        if (urlResult.isErr()) {
          return err(
            new CardValidationError(
              `Invalid URL: ${urlResult.error.message}`
            )
          );
        }
        url = urlResult.value;
      } else if ('url' in props.cardInput && props.cardInput.url) {
        // Handle optional URL for NOTE and HIGHLIGHT cards
        const urlResult = URL.create(props.cardInput.url);
        if (urlResult.isErr()) {
          return err(
            new CardValidationError(
              `Invalid URL: ${urlResult.error.message}`
            )
          );
        }
        url = urlResult.value;
      }

      // Create the card
      return Card.create({
        curatorId,
        type: cardType,
        content,
        url,
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

    const url = urlResult.value;

    // Require metadata for URL cards
    if (!input.metadata) {
      return err(
        new CardValidationError("URL metadata is required for creating URL cards")
      );
    }

    return CardContent.createUrlContent(url, input.metadata);
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
