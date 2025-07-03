import { Result } from "../../../../shared/core/Result";
import { UseCaseError } from "../../../../shared/core/UseCaseError";
import { AnnotationsFromTemplate } from "../../domain/aggregates/AnnotationsFromTemplate";
import { AnnotationId } from "../../domain/value-objects";
import { PublishedRecordId } from "../../../cards/domain/value-objects/PublishedRecordId";

export type PublishedAnnotationsFromTemplateResult = Map<
  string,
  PublishedRecordId
>;

export interface IAnnotationsFromTemplatePublisher {
  publish(
    annotationsFromTemplate: AnnotationsFromTemplate
  ): Promise<Result<PublishedAnnotationsFromTemplateResult, UseCaseError>>;

  /**
   * Unpublishes (deletes) an Annotation record.
   * @param recordId The ID (e.g., AT URI) of the record to unpublish.
   * @returns A Result indicating success (void) or a UseCaseError on failure.
   */
  unpublish(
    recordIds: PublishedRecordId[]
  ): Promise<Result<void, UseCaseError>>;
}
