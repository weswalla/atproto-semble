import { Result, ok, err } from '../../../../shared/core/Result';
import {
  IAtUriResolutionService,
  AtUriResourceType,
  AtUriResolutionResult,
} from '../../domain/services/IAtUriResolutionService';
import { CollectionId } from '../../domain/value-objects/CollectionId';
import { CardId } from '../../domain/value-objects/CardId';
import { InMemoryCollectionRepository } from './InMemoryCollectionRepository';

export class InMemoryAtUriResolutionService implements IAtUriResolutionService {
  constructor(private collectionRepository: InMemoryCollectionRepository) {}

  async resolveAtUri(
    atUri: string,
  ): Promise<Result<AtUriResolutionResult | null>> {
    try {
      // Get all collections and check if any have a published record with this URI
      const allCollections = this.collectionRepository.getAllCollections();

      for (const collection of allCollections) {
        if (collection.publishedRecordId?.uri === atUri) {
          return ok({
            type: AtUriResourceType.COLLECTION,
            id: collection.collectionId,
          });
        }
      }

      return ok(null);
    } catch (error) {
      return err(error as Error);
    }
  }

  async resolveCollectionId(
    atUri: string,
  ): Promise<Result<CollectionId | null>> {
    const result = await this.resolveAtUri(atUri);

    if (result.isErr()) {
      return err(result.error);
    }

    if (!result.value || result.value.type !== AtUriResourceType.COLLECTION) {
      return ok(null);
    }

    return ok(result.value.id as CollectionId);
  }

  async resolveCardId(atUri: string): Promise<Result<CardId | null>> {
    const result = await this.resolveAtUri(atUri);

    if (result.isErr()) {
      return err(result.error);
    }

    if (!result.value || result.value.type !== AtUriResourceType.CARD) {
      return ok(null);
    }

    return ok(result.value.id as CardId);
  }

  async resolveCollectionLinkId(
    atUri: string,
  ): Promise<Result<{ collectionId: CollectionId; cardId: CardId } | null>> {
    const result = await this.resolveAtUri(atUri);

    if (result.isErr()) {
      return err(result.error);
    }

    if (
      !result.value ||
      result.value.type !== AtUriResourceType.COLLECTION_LINK
    ) {
      return ok(null);
    }

    return ok(
      result.value.id as { collectionId: CollectionId; cardId: CardId },
    );
  }
}
