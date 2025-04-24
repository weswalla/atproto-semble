import { Annotation } from '../../domain/aggregates/Annotation';
import { Result } from '../../../../shared/core/Result';
import { UseCaseError } from '../../../../shared/core/UseCaseError';
import { PublishedRecordId } from '../../domain/value-objects/PublishedRecordId';

/**
 * @description Interface for publishing Annotation aggregates.
 * Defines the contract for how annotations are made publicly available or updated.
 */
export interface IAnnotationPublisher {
  /**
   * Publishes an Annotation aggregate, either creating a new record or updating an existing one.
   * @param annotation The Annotation aggregate to publish.
   * @returns A Result indicating success (void) or a UseCaseError on failure.
   */
  publish(
    annotation: Annotation,
  ): Promise<Result<PublishedRecordId, UseCaseError>>;

  /**
   * Unpublishes (deletes) an Annotation record.
   * @param recordId The ID (e.g., AT URI) of the record to unpublish.
   * @returns A Result indicating success (void) or a UseCaseError on failure.
   */
  unpublish(recordId: PublishedRecordId): Promise<Result<void, UseCaseError>>;
}
