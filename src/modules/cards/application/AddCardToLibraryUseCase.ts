import { Result, ok, err } from "../../../shared/core/Result";
import { UseCase } from "../../../shared/core/UseCase";
import { UseCaseError } from "../../../shared/core/UseCaseError";
import { AppError } from "../../../shared/core/AppError";
import { ICardRepository } from "../domain/ICardRepository";
import { ICollectionRepository } from "../domain/ICollectionRepository";
import { CardFactory, CardCreationInput } from "../domain/CardFactory";
import { CollectionId } from "../domain/value-objects/CollectionId";
import { CuratorId } from "../../annotations/domain/value-objects/CuratorId";
import { Card, CardValidationError } from "../domain/Card";
import { CollectionAccessError } from "../domain/Collection";
import { IMetadataService } from "../domain/services/IMetadataService";
import { CardTypeEnum } from "../domain/value-objects/CardType";
import { URL } from "../domain/value-objects/URL";
import { ICardPublisher } from "./ports/ICardPublisher";
import { ICollectionPublisher } from "./ports/ICollectionPublisher";

export interface AddCardToLibraryDTO {
  curatorId: string;
  cardInput: CardCreationInput;
  collectionIds?: string[];
}

export interface AddCardToLibraryResponseDTO {
  cardId: string;
  publishedRecordId?: {
    uri: string;
    cid: string;
  };
  addedToCollections: string[];
  failedCollections: Array<{
    collectionId: string;
    reason: string;
  }>;
}

export class ValidationError extends UseCaseError {
  constructor(message: string) {
    super(message);
  }
}

export class CardNotFoundError extends UseCaseError {
  constructor(cardId: string) {
    super(`Card not found: ${cardId}`);
  }
}

export class CollectionNotFoundError extends UseCaseError {
  constructor(collectionId: string) {
    super(`Collection not found: ${collectionId}`);
  }
}

export class AddCardToLibraryUseCase
  implements
    UseCase<
      AddCardToLibraryDTO,
      Result<
        AddCardToLibraryResponseDTO,
        ValidationError | CardNotFoundError | CollectionNotFoundError | AppError.UnexpectedError
      >
    >
{
  constructor(
    private cardRepository: ICardRepository,
    private collectionRepository: ICollectionRepository,
    private metadataService: IMetadataService,
    private cardPublisher: ICardPublisher,
    private collectionPublisher: ICollectionPublisher
  ) {}

  async execute(
    request: AddCardToLibraryDTO
  ): Promise<
    Result<
      AddCardToLibraryResponseDTO,
      ValidationError | CardNotFoundError | CollectionNotFoundError | AppError.UnexpectedError
    >
  > {
    try {
      // Validate and create CuratorId
      const curatorIdResult = CuratorId.create(request.curatorId);
      if (curatorIdResult.isErr()) {
        return err(
          new ValidationError(
            `Invalid curator ID: ${curatorIdResult.error.message}`
          )
        );
      }
      const curatorId = curatorIdResult.value;

      // Fetch metadata for URL cards
      let cardInput = request.cardInput;
      if (request.cardInput.type === CardTypeEnum.URL) {
        const urlResult = URL.create(request.cardInput.url);
        if (urlResult.isErr()) {
          return err(new ValidationError(`Invalid URL: ${urlResult.error.message}`));
        }

        const url = urlResult.value;
        const metadataResult = await this.metadataService.fetchMetadata(url);
        
        if (metadataResult.isErr()) {
          return err(new ValidationError(`Failed to fetch metadata: ${metadataResult.error.message}`));
        }

        cardInput = {
          ...request.cardInput,
          metadata: metadataResult.value,
        };
      }

      // Create the card using CardFactory
      const cardResult = CardFactory.create({
        curatorId: request.curatorId,
        cardInput: cardInput,
      });

      if (cardResult.isErr()) {
        return err(new ValidationError(cardResult.error.message));
      }

      const card = cardResult.value;

      // Publish the card first
      const publishResult = await this.cardPublisher.publish(card);
      if (publishResult.isErr()) {
        return err(new ValidationError(`Failed to publish card: ${publishResult.error.message}`));
      }

      // Mark the card as published
      card.markAsPublished(publishResult.value);

      // Save the card to the repository only after successful publication
      const saveCardResult = await this.cardRepository.save(card);
      if (saveCardResult.isErr()) {
        return err(AppError.UnexpectedError.create(saveCardResult.error));
      }

      // Handle collection additions if specified
      const addedToCollections: string[] = [];
      const failedCollections: Array<{ collectionId: string; reason: string }> = [];

      if (request.collectionIds && request.collectionIds.length > 0) {
        for (const collectionIdStr of request.collectionIds) {
          try {
            // Validate collection ID
            const collectionIdResult = CollectionId.createFromString(collectionIdStr);
            if (collectionIdResult.isErr()) {
              failedCollections.push({
                collectionId: collectionIdStr,
                reason: `Invalid collection ID: ${collectionIdResult.error.message}`,
              });
              continue;
            }

            const collectionId = collectionIdResult.value;

            // Find the collection
            const collectionResult = await this.collectionRepository.findById(collectionId);
            if (collectionResult.isErr()) {
              return err(AppError.UnexpectedError.create(collectionResult.error));
            }

            const collection = collectionResult.value;
            if (!collection) {
              failedCollections.push({
                collectionId: collectionIdStr,
                reason: "Collection not found",
              });
              continue;
            }

            // Try to add the card to the collection
            const addCardResult = collection.addCard(card.cardId, curatorId);
            if (addCardResult.isErr()) {
              failedCollections.push({
                collectionId: collectionIdStr,
                reason: addCardResult.error.message,
              });
              continue;
            }

            // Publish the updated collection
            const publishCollectionResult = await this.collectionPublisher.publish(collection);
            if (publishCollectionResult.isErr()) {
              failedCollections.push({
                collectionId: collectionIdStr,
                reason: `Failed to publish collection: ${publishCollectionResult.error.message}`,
              });
              continue;
            }

            // Mark the collection as published
            collection.markAsPublished(publishCollectionResult.value);

            // Save the updated collection
            const saveCollectionResult = await this.collectionRepository.save(collection);
            if (saveCollectionResult.isErr()) {
              failedCollections.push({
                collectionId: collectionIdStr,
                reason: "Failed to save collection",
              });
              continue;
            }

            addedToCollections.push(collectionIdStr);

          } catch (error) {
            failedCollections.push({
              collectionId: collectionIdStr,
              reason: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
      }

      return ok({
        cardId: card.cardId.getStringValue(),
        publishedRecordId: card.publishedRecordId ? {
          uri: card.publishedRecordId.uri,
          cid: card.publishedRecordId.cid,
        } : undefined,
        addedToCollections,
        failedCollections,
      });

    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }
}
