import { Collection } from "../../domain/Collection";
import { Result } from "../../../../shared/core/Result";
import { UseCaseError } from "../../../../shared/core/UseCaseError";
import { PublishedRecordId } from "../../domain/value-objects/PublishedRecordId";

export interface CollectionPublishResult {
  collectionRecord?: PublishedRecordId; // If collection itself was published/updated
  publishedLinks: Array<{
    cardId: string;
    linkRecord: PublishedRecordId;
  }>; // Links that were published
}

/**
 * @description Interface for publishing Collection aggregates.
 * Defines the contract for how collections are made publicly available or updated.
 */
export interface ICollectionPublisher {
  /**
   * Publishes a Collection aggregate, either creating a new record or updating an existing one.
   * @param collection The Collection aggregate to publish.
   * @returns A Result indicating success with CollectionPublishResult or a UseCaseError on failure.
   */
  publish(collection: Collection): Promise<Result<CollectionPublishResult, UseCaseError>>;

  /**
   * Unpublishes (deletes) a Collection record.
   * @param recordId The ID (e.g., AT URI) of the record to unpublish.
   * @returns A Result indicating success (void) or a UseCaseError on failure.
   */
  unpublish(recordId: PublishedRecordId): Promise<Result<void, UseCaseError>>;
}
