import { Card } from "../../domain/Card";
import { Result } from "../../../../shared/core/Result";
import { UseCaseError } from "../../../../shared/core/UseCaseError";
import { PublishedRecordId } from "../../domain/value-objects/PublishedRecordId";

/**
 * @description Interface for publishing Card aggregates.
 * Defines the contract for how cards are made publicly available or updated.
 */
export interface ICardPublisher {
  /**
   * Publishes a Card aggregate, either creating a new record or updating an existing one.
   * @param card The Card aggregate to publish.
   * @returns A Result indicating success with PublishedRecordId or a UseCaseError on failure.
   */
  publish(card: Card): Promise<Result<PublishedRecordId, UseCaseError>>;

  /**
   * Unpublishes (deletes) a Card record.
   * @param recordId The ID (e.g., AT URI) of the record to unpublish.
   * @returns A Result indicating success (void) or a UseCaseError on failure.
   */
  unpublish(recordId: PublishedRecordId): Promise<Result<void, UseCaseError>>;
}
