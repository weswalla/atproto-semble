import { UseCase } from "../../../../shared/core/UseCase";
import { IAnnotationRepository } from "../repositories/IAnnotationRepository";
import { IAnnotationPublisher } from "../ports/IAnnotationPublisher";
import { Result, ok, err } from "../../../../shared/core/Result";
import { AppError } from "../../../../shared/core/AppError";
import { Annotation } from "../../domain/aggregates/Annotation";
import { AnnotationsFromTemplate } from "../../domain/aggregates/AnnotationsFromTemplate";
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
import { IAnnotationTemplateRepository } from "../repositories/IAnnotationTemplateRepository";

// Define specific errors
export namespace CreateAndPublishAnnotationsFromTemplateErrors {
  export class TemplateNotFound extends UseCaseError {
    constructor(templateId: string) {
      super(`Template with ID ${templateId} not found`);
    }
  }

  export class AnnotationCreationFailed extends UseCaseError {
    constructor(message: string) {
      super(`Failed to create annotations: ${message}`);
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

// Single annotation input for a template
export interface AnnotationInput {
  annotationFieldId: string;
  type: string;
  value: AnnotationValueInput;
  note?: string;
}

export interface CreateAndPublishAnnotationsFromTemplateDTO {
  curatorId: string;
  url: string;
  templateId: string;
  annotations: AnnotationInput[];
}

export type CreateAndPublishAnnotationsFromTemplateResponse = Result<
  { annotationIds: string[] },
  | CreateAndPublishAnnotationsFromTemplateErrors.TemplateNotFound
  | CreateAndPublishAnnotationsFromTemplateErrors.AnnotationCreationFailed
  | CreateAndPublishAnnotationsFromTemplateErrors.AnnotationPublishFailed
  | CreateAndPublishAnnotationsFromTemplateErrors.AnnotationSaveFailed
  | AppError.UnexpectedError
>;

export class CreateAndPublishAnnotationsFromTemplateUseCase
  implements
    UseCase<
      CreateAndPublishAnnotationsFromTemplateDTO,
      Promise<CreateAndPublishAnnotationsFromTemplateResponse>
    >
{
  constructor(
    private readonly annotationRepository: IAnnotationRepository,
    private readonly annotationTemplateRepository: IAnnotationTemplateRepository,
    private readonly annotationPublisher: IAnnotationPublisher
  ) {}

  async execute(
    request: CreateAndPublishAnnotationsFromTemplateDTO
  ): Promise<CreateAndPublishAnnotationsFromTemplateResponse> {
    try {
      // Create common value objects
      const curatorIdOrError = CuratorId.create(request.curatorId);
      const urlOrError = URI.create(request.url);
      const templateIdOrError = AnnotationTemplateId.create(
        new UniqueEntityID(request.templateId)
      );

      if (
        curatorIdOrError.isErr() ||
        urlOrError.isErr() ||
        templateIdOrError.isErr()
      ) {
        return err(
          new CreateAndPublishAnnotationsFromTemplateErrors.AnnotationCreationFailed(
            "Invalid common properties"
          )
        );
      }

      const curatorId = curatorIdOrError.value;
      const url = urlOrError.value;
      const templateId = templateIdOrError.value;

      // Fetch the template
      const template =
        await this.annotationTemplateRepository.findById(templateId);
      if (!template) {
        return err(
          new CreateAndPublishAnnotationsFromTemplateErrors.TemplateNotFound(
            templateId.getValue().toString()
          )
        );
      }

      // Create annotations from inputs
      const annotations: Annotation[] = [];

      for (const annotationInput of request.annotations) {
        const fieldIdOrError = AnnotationFieldId.create(
          new UniqueEntityID(annotationInput.annotationFieldId)
        );
        const type = AnnotationType.create(annotationInput.type);
        const note = annotationInput.note
          ? AnnotationNote.create(annotationInput.note)
          : undefined;

        if (fieldIdOrError.isErr()) {
          return err(
            new CreateAndPublishAnnotationsFromTemplateErrors.AnnotationCreationFailed(
              "Invalid annotation properties"
            )
          );
        }

        // Create annotation value
        const valueOrError = AnnotationValueFactory.create({
          type: type,
          valueInput: annotationInput.value,
        });

        if (valueOrError.isErr()) {
          return err(
            new CreateAndPublishAnnotationsFromTemplateErrors.AnnotationCreationFailed(
              `Invalid annotation value: ${valueOrError.error.message}`
            )
          );
        }

        // Create annotation with template ID
        const annotationOrError = Annotation.create({
          curatorId,
          url,
          annotationFieldId: fieldIdOrError.value,
          value: valueOrError.value,
          note: note,
          annotationTemplateIds: [templateId],
        });

        if (annotationOrError.isErr()) {
          return err(
            new CreateAndPublishAnnotationsFromTemplateErrors.AnnotationCreationFailed(
              annotationOrError.error || "Failed to create annotation"
            )
          );
        }

        annotations.push(annotationOrError.value);
      }

      // Create AnnotationsFromTemplate aggregate to enforce invariants
      const annotationsFromTemplateResult = AnnotationsFromTemplate.create({
        annotations,
        template,
        curatorId,
        createdAt: new Date(),
      });

      if (annotationsFromTemplateResult.isErr()) {
        return err(
          new CreateAndPublishAnnotationsFromTemplateErrors.AnnotationCreationFailed(
            annotationsFromTemplateResult.error ||
              "Annotations do not satisfy template requirements"
          )
        );
      }

      // Get the AnnotationsFromTemplate instance
      const annotationsFromTemplate = annotationsFromTemplateResult.value;
      
      // Publish and save each annotation
      const publishedAnnotationIds: string[] = [];
      const publishedRecordIds = new Map<string, PublishedRecordId>();

      for (const annotation of annotationsFromTemplate.annotations) {
        // Publish annotation
        const publishResult =
          await this.annotationPublisher.publish(annotation);
        if (publishResult.isErr()) {
          return err(
            new CreateAndPublishAnnotationsFromTemplateErrors.AnnotationPublishFailed(
              annotation.id.toString(),
              publishResult.error.message
            )
          );
        }

        // Store the published record ID for later batch update
        const annotationIdString = annotation.annotationId.getStringValue();
        publishedRecordIds.set(annotationIdString, publishResult.value);
        publishedAnnotationIds.push(annotationIdString);
      }
      
      // Mark all annotations as published in one operation
      const markPublishedResult = annotationsFromTemplate.markAllAnnotationsAsPublished(publishedRecordIds);
      if (markPublishedResult.isErr()) {
        return err(
          new CreateAndPublishAnnotationsFromTemplateErrors.AnnotationPublishFailed(
            "batch",
            markPublishedResult.error
          )
        );
      }
      
      // Save all annotations
      try {
        for (const annotation of annotationsFromTemplate.annotations) {
          await this.annotationRepository.save(annotation);
        }
      } catch (error: any) {
        return err(
          new CreateAndPublishAnnotationsFromTemplateErrors.AnnotationSaveFailed(
            "batch",
            error.message
          )
        );
      }

      return ok({ annotationIds: publishedAnnotationIds });
    } catch (error: any) {
      return err(new AppError.UnexpectedError(error));
    }
  }
}
