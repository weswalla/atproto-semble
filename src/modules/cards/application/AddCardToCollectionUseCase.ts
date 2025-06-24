import { err, ok, Result } from "../../../shared/core/Result";
import { UseCase } from "../../../shared/core/UseCase";
import { UseCaseError } from "../../../shared/core/UseCaseError";
import { AppError } from "../../../shared/core/AppError";
import { ICardRepository } from "../domain/ICardRepository";
import { ICollectionRepository } from "../domain/ICollectionRepository";
import { CardId } from "../domain/value-objects/CardId";
import { CollectionId } from "../domain/value-objects/CollectionId";
import { CuratorId } from "../../annotations/domain/value-objects/CuratorId";
import { UniqueEntityID } from "../../../shared/domain/UniqueEntityID";
import { ICollectionPublisher } from "./ports/ICollectionPublisher";

export interface AddCardToCollectionDTO {
  cardId: string;
  collectionId: string;
  userId: string;
}

export interface AddCardToCollectionResponseDTO {
  cardId: string;
  collectionId: string;
  collectionRecord?: { uri: string; cid: string };
  publishedLinks: Array<{
    cardId: string;
    linkRecord: { uri: string; cid: string };
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

export class AddCardToCollectionUseCase
  implements
    UseCase<
      AddCardToCollectionDTO,
      Result<
        AddCardToCollectionResponseDTO,
        ValidationError | CardNotFoundError | CollectionNotFoundError | AppError.UnexpectedError
      >
    >
{
  constructor(
    private cardRepository: ICardRepository,
    private collectionRepository: ICollectionRepository,
    private collectionPublisher: ICollectionPublisher
  ) {}

  async execute(
    request: AddCardToCollectionDTO
  ): Promise<
    Result<
      AddCardToCollectionResponseDTO,
      ValidationError | CardNotFoundError | CollectionNotFoundError | AppError.UnexpectedError
    >
  > {
    try {
      // Validate and create CardId
      const cardId = CardId.create(new UniqueEntityID(request.cardId)).unwrap();
      
      // Validate and create CollectionId
      const collectionId = CollectionId.create(
        new UniqueEntityID(request.collectionId)
      ).unwrap();
      
      // Validate and create CuratorId
      const userIdResult = CuratorId.create(request.userId);
      if (userIdResult.isErr()) {
        return err(
          new ValidationError(
            `Invalid user ID: ${userIdResult.error.message}`
          )
        );
      }
      const userId = userIdResult.value;

      // Check if card exists
      const cardResult = await this.cardRepository.findById(cardId);
      if (cardResult.isErr()) {
        return err(AppError.UnexpectedError.create(cardResult.error));
      }

      if (!cardResult.value) {
        return err(new CardNotFoundError(request.cardId));
      }

      // Find the collection
      const collectionResult = await this.collectionRepository.findById(collectionId);
      if (collectionResult.isErr()) {
        return err(AppError.UnexpectedError.create(collectionResult.error));
      }

      const collection = collectionResult.value;
      if (!collection) {
        return err(new CollectionNotFoundError(request.collectionId));
      }

      // Add card to collection
      const addCardResult = collection.addCard(cardId, userId);
      if (addCardResult.isErr()) {
        return err(new ValidationError(addCardResult.error.message));
      }

      // Publish the collection (including new links)
      const publishCollectionResult = await this.collectionPublisher.publish(collection);
      if (publishCollectionResult.isErr()) {
        return err(new ValidationError(`Failed to publish collection: ${publishCollectionResult.error.message}`));
      }

      const publishResult = publishCollectionResult.value;

      // Mark each published link as published in the collection
      for (const publishedLink of publishResult.publishedLinks) {
        collection.markCardLinkAsPublished(cardId, publishedLink.linkRecord);
      }

      // Mark the collection as published if it has a collection record
      if (publishResult.collectionRecord) {
        collection.markAsPublished(publishResult.collectionRecord);
      }

      // Save the updated collection
      const saveCollectionResult = await this.collectionRepository.save(collection);
      if (saveCollectionResult.isErr()) {
        return err(AppError.UnexpectedError.create(saveCollectionResult.error));
      }

      return ok({
        cardId: request.cardId,
        collectionId: request.collectionId,
        collectionRecord: publishResult.collectionRecord ? {
          uri: publishResult.collectionRecord.uri,
          cid: publishResult.collectionRecord.cid
        } : undefined,
        publishedLinks: publishResult.publishedLinks
      });

    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }
}
