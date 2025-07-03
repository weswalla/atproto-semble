import { AnnotationTemplate } from "../../domain/aggregates/AnnotationTemplate";
import { Result } from "../../../../shared/core/Result";
import { UseCaseError } from "../../../../shared/core/UseCaseError";
import { PublishedRecordId } from "../../../cards/domain/value-objects/PublishedRecordId";

/**
 * @description Interface for publishing AnnotationTemplate aggregates.
 * Defines the contract for how annotation templates are made publicly available or updated.
 */
export interface IAnnotationTemplatePublisher {
  /**
   * Publishes an AnnotationTemplate aggregate, either creating a new record or updating an existing one.
   * @param template The AnnotationTemplate aggregate to publish.
   * @returns A Result indicating success (void) or a UseCaseError on failure.
   */
  publish(
    template: AnnotationTemplate
  ): Promise<Result<PublishedRecordId, UseCaseError>>;

  /**
   * Unpublishes (deletes) an AnnotationTemplate record.
   * @param recordId The ID (e.g., AT URI) of the record to unpublish.
   * @returns A Result indicating success (void) or a UseCaseError on failure.
   */
  unpublish(recordId: PublishedRecordId): Promise<Result<void, UseCaseError>>;
}
