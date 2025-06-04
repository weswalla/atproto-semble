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
  metadataService: IMetadataService;
}

export class CardFactory {
  static async create(props: CreateCardProps): Promise<Result<Card, CardValidationError>> {
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
      const contentResult = await this.createCardContent(props.cardInput, props.metadataService);
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

  private static async createCardContent(
    cardInput: CardCreationInput,
    metadataService: IMetadataService
  ): Promise<Result<CardContent, CardValidationError>> {
    switch (cardInput.type) {
      case CardTypeEnum.URL:
        return await this.createUrlContent(cardInput, metadataService);

      case CardTypeEnum.NOTE:
        return this.createNoteContent(cardInput);

      case CardTypeEnum.HIGHLIGHT:
        return this.createHighlightContent(cardInput);

      default:
        return err(new CardValidationError("Invalid card type"));
    }
  }

  private static async createUrlContent(
    input: IUrlCardInput,
    metadataService: IMetadataService
  ): Promise<Result<CardContent, CardValidationError>> {
    // Create URL value object
    const urlResult = URL.create(input.url);
    if (urlResult.isErr()) {
      return err(
        new CardValidationError(`Invalid URL: ${urlResult.error.message}`)
      );
    }

    const url = urlResult.value;

    // Fetch metadata using the metadata service
    let metadata: UrlMetadata | undefined;
    try {
      const metadataResult = await metadataService.fetchMetadata(url);
      if (metadataResult.isOk()) {
        metadata = metadataResult.value;
      }
      // If metadata fetch fails, we continue without metadata
      // This allows URL cards to be created even if metadata service is unavailable
    } catch (error) {
      // Log the error but don't fail the card creation
      console.warn(`Failed to fetch metadata for URL ${input.url}:`, error);
    }

    return CardContent.createUrlContent(url, metadata);
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
