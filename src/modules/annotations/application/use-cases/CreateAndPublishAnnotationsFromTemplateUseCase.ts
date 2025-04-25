import { UseCase } from '../../../../shared/core/UseCase';
import { IAnnotationRepository } from '../repositories/IAnnotationRepository';
import { IAnnotationPublisher } from '../ports/IAnnotationPublisher';
import { Result, ok, err } from '../../../../shared/core/Result';
import { AppError } from '../../../../shared/core/AppError';
import { Annotation } from '../../domain/aggregates/Annotation';
import {
  CuratorId,
  URI,
  AnnotationFieldId,
  AnnotationValue,
  AnnotationNote,
  AnnotationTemplateId,
} from '../../domain/value-objects';
import { UniqueEntityID } from '../../../../shared/domain/UniqueEntityID';
import { UseCaseError } from '../../../../shared/core/UseCaseError';

// Define potential specific errors (minimal for now)
export namespace CreateAndPublishAnnotationErrors {
  export class AnnotationCreationFailed extends UseCaseError {
    constructor(error: string) {
      super(`Failed to create annotation: ${error}`);
    }
  }
  export class AnnotationPublishFailed extends UseCaseError {
    constructor(error: string) {
      super(`Failed to publish annotation: ${error}`);
    }
  }
  export class AnnotationSaveFailed extends UseCaseError {
    constructor(error: string) {
      super(`Failed to save annotation: ${error}`);
    }
  }
  // Add validation errors if needed (e.g., FieldNotFound)
}

export interface CreateAndPublishAnnotationDTO {
  curatorId: string;
  url: string;
  annotationFieldId: string;
  value: any; // Raw value, validation happens during VO creation
  annotationTemplateIds?: string[];
  note?: string;
}

export type CreateAndPublishAnnotationResponse = Result<
  { annotationId: string },
  | CreateAndPublishAnnotationErrors.AnnotationCreationFailed
  | CreateAndPublishAnnotationErrors.AnnotationPublishFailed
  | CreateAndPublishAnnotationErrors.AnnotationSaveFailed
  | AppError.UnexpectedError
>;

export class CreateAndPublishAnnotationUseCase
  implements
    UseCase<
      CreateAndPublishAnnotationDTO,
      Promise<CreateAndPublishAnnotationResponse>
    >
{
  constructor(
    private readonly annotationRepository: IAnnotationRepository,
    private readonly annotationPublisher: IAnnotationPublisher, // Assuming IAnnotationPublisher exists
                                                              // Add IAnnotationFieldRepository if field validation is needed
  ) {}

  async execute(
    request: CreateAndPublishAnnotationDTO,
  ): Promise<CreateAndPublishAnnotationResponse> {
    try {
      // 1. Create Value Objects from DTO
      const curatorIdOrError = CuratorId.create(request.curatorId);
      const urlOrError = URI.create(request.url);
      const fieldIdOrError = AnnotationFieldId.create(
        new UniqueEntityID(request.annotationFieldId),
      ); // Assuming fieldId is UniqueEntityID string
      const valueOrError = AnnotationValue.create(request.value); // Assuming generic create
      const noteOrError = request.note
        ? AnnotationNote.create(request.note)
        : ok(undefined);
      const templateIdsOrError = Result.all(
        (request.annotationTemplateIds ?? []).map((id) =>
          AnnotationTemplateId.create(new UniqueEntityID(id)),
        ),
      );

      const combinedProps = Result.combineWithAllErrors([
        curatorIdOrError,
        urlOrError,
        fieldIdOrError,
        valueOrError,
        noteOrError,
        templateIdsOrError, // Combine the Result<AnnotationTemplateId[]>
      ]);

      if (combinedProps.isErr()) {
        const errorMessages = combinedProps.error.map((e) => e.message).join('; ');
        return err(
          new CreateAndPublishAnnotationErrors.AnnotationCreationFailed(
            `Invalid properties: ${errorMessages}`,
          ),
        );
      }

      const [
        curatorId,
        url,
        annotationFieldId,
        value,
        optionalNote,
        templateIds,
      ] = combinedProps.value;

      // Optional: Validate fieldId exists using IAnnotationFieldRepository

      // 2. Create Annotation Aggregate
      const annotationOrError = Annotation.create({
        curatorId,
        url,
        annotationFieldId,
        value,
        note: optionalNote, // Pass optional note
        annotationTemplateIds: templateIds, // Pass array of template IDs
      });

      if (annotationOrError.isErr()) {
        return err(
          new CreateAndPublishAnnotationErrors.AnnotationCreationFailed(
            annotationOrError.error.message,
          ),
        );
      }
      const annotation = annotationOrError.value;
      const annotationIdString = annotation.annotationId.getStringValue();

      // 3. Publish Annotation
      const publishResult = await this.annotationPublisher.publish(annotation);

      if (publishResult.isErr()) {
        return err(
          new CreateAndPublishAnnotationErrors.AnnotationPublishFailed(
            publishResult.error.message,
          ),
        );
      }
      const publishedRecordId = publishResult.value;

      // 4. Update Annotation with PublishedRecordId
      annotation.markAsPublished(publishedRecordId); // Assuming this method exists

      // 5. Save Annotation
      try {
        await this.annotationRepository.save(annotation);
      } catch (error: any) {
        return err(
          new CreateAndPublishAnnotationErrors.AnnotationSaveFailed(
            error.message,
          ),
        );
      }

      // 6. Return Success
      return ok({ annotationId: annotationIdString });
    } catch (error: any) {
      return err(new AppError.UnexpectedError(error));
    }
  }
}
