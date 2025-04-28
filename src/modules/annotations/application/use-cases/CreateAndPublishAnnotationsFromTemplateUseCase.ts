import { UseCase } from "../../../../shared/core/UseCase";
import { IAnnotationRepository } from "../repositories/IAnnotationRepository";
import { IAnnotationPublisher } from "../ports/IAnnotationPublisher";
import { Result, ok, err } from "../../../../shared/core/Result";
import { AppError } from "../../../../shared/core/AppError";
import { Annotation } from "../../domain/aggregates/Annotation";
import {
  CuratorId,
  URI,
  AnnotationFieldId,
  AnnotationNote,
  AnnotationTemplateId,
} from "../../domain/value-objects";
import { UniqueEntityID } from "../../../../shared/domain/UniqueEntityID";
import { UseCaseError } from "../../../../shared/core/UseCaseError";
import {
  AnnotationValueFactory,
  AnnotationValueInput,
} from "../../domain/AnnotationValueFactory";
import { AnnotationType } from "../../domain/value-objects/AnnotationType";

// Define specific errors
export namespace CreateAndPublishAnnotationErrors {
  export class AnnotationCreationFailed extends UseCaseError {
    constructor(message: string) {
      super(`Failed to create annotation: ${message}`);
    }
  }

  export class AnnotationPublishFailed extends UseCaseError {
    constructor(id: string, message: string) {
      super(`Failed to publish annotation ${id}: ${message}`);
    }
  }

  export class AnnotationSaveFailed extends UseCaseError {
    constructor(id: string, message: string) {
      super(`Failed to save annotation ${id}: ${message}`);
    }
  }
}

export interface CreateAndPublishAnnotationDTO {
  curatorId: string;
  url: string;
  annotationFieldId: string;
  type: string; // The annotation type (dyad, triad, etc.)
  value: AnnotationValueInput; // Using the type from AnnotationValueFactory
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
    private readonly annotationPublisher: IAnnotationPublisher
  ) {}

  async execute(
    request: CreateAndPublishAnnotationDTO
  ): Promise<CreateAndPublishAnnotationResponse> {
    try {
      // Create value objects
      const curatorIdOrError = CuratorId.create(request.curatorId);
      const urlOrError = URI.create(request.url);
      const fieldIdOrError = AnnotationFieldId.create(
        new UniqueEntityID(request.annotationFieldId)
      );
      const type = AnnotationType.create(request.type);

      // Handle optional values
      const note = request.note
        ? AnnotationNote.create(request.note)
        : undefined;

      const templateIdsOrError = request.annotationTemplateIds
        ? Result.all(
            request.annotationTemplateIds.map((id) =>
              AnnotationTemplateId.create(new UniqueEntityID(id))
            )
          )
        : ok([]);

      // Validate all value objects
      if (
        curatorIdOrError.isErr() ||
        urlOrError.isErr() ||
        fieldIdOrError.isErr() ||
        templateIdsOrError.isErr()
      ) {
        return err(
          new CreateAndPublishAnnotationErrors.AnnotationCreationFailed(
            "Invalid annotation properties"
          )
        );
      }

      // Create annotation value
      const valueOrError = AnnotationValueFactory.create({
        type: type,
        valueInput: request.value,
      });

      if (valueOrError.isErr()) {
        return err(
          new CreateAndPublishAnnotationErrors.AnnotationCreationFailed(
            `Invalid annotation value: ${valueOrError.error.message}`
          )
        );
      }

      // Create annotation aggregate
      const annotationOrError = Annotation.create({
        curatorId: curatorIdOrError.value,
        url: urlOrError.value,
        annotationFieldId: fieldIdOrError.value,
        value: valueOrError.value,
        note: note,
        annotationTemplateIds: templateIdsOrError.value,
      });

      if (annotationOrError.isErr()) {
        return err(
          new CreateAndPublishAnnotationErrors.AnnotationCreationFailed(
            annotationOrError.error
          )
        );
      }

      const annotation = annotationOrError.value;

      // Publish annotation
      const publishResult = await this.annotationPublisher.publish(annotation);
      if (publishResult.isErr()) {
        return err(
          new CreateAndPublishAnnotationErrors.AnnotationPublishFailed(
            annotation.id.toString(),
            publishResult.error.message
          )
        );
      }

      // Mark as published and save
      annotation.markAsPublished(publishResult.value);

      try {
        await this.annotationRepository.save(annotation);
      } catch (error: any) {
        return err(
          new CreateAndPublishAnnotationErrors.AnnotationSaveFailed(
            annotation.id.toString(),
            error.message
          )
        );
      }

      return ok({ annotationId: annotation.annotationId.getStringValue() });
    } catch (error: any) {
      return err(new AppError.UnexpectedError(error));
    }
  }
}
