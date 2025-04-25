import { AnnotationField } from "../../domain/AnnotationField";
import { Result } from "../../../../shared/core/Result";
import { UseCaseError } from "../../../../shared/core/UseCaseError";
import { PublishedRecordId } from "../../domain/value-objects/PublishedRecordId";

/**
 * @description Interface for publishing AnnotationField aggregates.
 * Defines the contract for how annotation fields are made publicly available or updated.
 */
export interface IAnnotationFieldPublisher {
  /**
   * Publishes an AnnotationField aggregate, either creating a new record or updating an existing one.
   * @param field The AnnotationField aggregate to publish.
   * @returns A Result indicating success (void) or a UseCaseError on failure.
   */
  publish(
    field: AnnotationField
  ): Promise<Result<PublishedRecordId, UseCaseError>>;

  /**
   * Unpublishes (deletes) an AnnotationField record.
   * @param recordId The ID (e.g., AT URI) of the record to unpublish.
   * @returns A Result indicating success (void) or a UseCaseError on failure.
   */
  unpublish(recordId: PublishedRecordId): Promise<Result<void, UseCaseError>>;
}
