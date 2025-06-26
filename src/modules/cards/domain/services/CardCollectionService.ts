import { Result, ok, err } from "../../../../shared/core/Result";
import { Card } from "../Card";
import { Collection } from "../Collection";
import { CuratorId } from "../../../annotations/domain/value-objects/CuratorId";
import { CollectionId } from "../value-objects/CollectionId";
import { ICollectionRepository } from "../ICollectionRepository";
import { ICollectionPublisher } from "../../application/ports/ICollectionPublisher";
import { AppError } from "../../../../shared/core/AppError";
import { DomainService } from "../../../../shared/domain/DomainService";

export class CardCollectionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CardCollectionValidationError';
  }
}

export class CardCollectionService implements DomainService {
  constructor(
    private collectionRepository: ICollectionRepository,
    private collectionPublisher: ICollectionPublisher
  ) {}

  async addCardToCollection(
    card: Card,
    collectionId: CollectionId,
    curatorId: CuratorId
  ): Promise<Result<void, CardCollectionValidationError | AppError.UnexpectedError>> {
    try {
      // Find the collection
      const collectionResult = await this.collectionRepository.findById(collectionId);
      if (collectionResult.isErr()) {
        return err(AppError.UnexpectedError.create(collectionResult.error));
      }

      const collection = collectionResult.value;
      if (!collection) {
        return err(
          new CardCollectionValidationError(
            `Collection not found: ${collectionId.getStringValue()}`
          )
        );
      }

      // Add card to collection
      const addCardResult = collection.addCard(card.cardId, curatorId);
      if (addCardResult.isErr()) {
        return err(
          new CardCollectionValidationError(
            `Failed to add card to collection: ${addCardResult.error.message}`
          )
        );
      }

      // Publish the collection link
      const publishLinkResult = await this.collectionPublisher.publishCardAddedToCollection(
        card,
        collection,
        curatorId
      );
      if (publishLinkResult.isErr()) {
        return err(
          new CardCollectionValidationError(
            `Failed to publish collection link: ${publishLinkResult.error.message}`
          )
        );
      }

      // Mark the card link as published in the collection
      collection.markCardLinkAsPublished(card.cardId, publishLinkResult.value);

      // Save the updated collection
      const saveCollectionResult = await this.collectionRepository.save(collection);
      if (saveCollectionResult.isErr()) {
        return err(AppError.UnexpectedError.create(saveCollectionResult.error));
      }

      return ok(undefined);
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }

  async addCardToCollections(
    card: Card,
    collectionIds: CollectionId[],
    curatorId: CuratorId
  ): Promise<Result<void, CardCollectionValidationError | AppError.UnexpectedError>> {
    for (const collectionId of collectionIds) {
      const result = await this.addCardToCollection(card, collectionId, curatorId);
      if (result.isErr()) {
        return result;
      }
    }
    return ok(undefined);
  }
}
