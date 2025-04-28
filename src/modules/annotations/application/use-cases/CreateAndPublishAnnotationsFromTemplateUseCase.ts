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
      const template = await this.annotationTemplateRepository.findById(templateId);
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
        const typeOrError = AnnotationType.create(annotationInput.type);
        const noteOrError = annotationInput.note
          ? AnnotationNote.create(annotationInput.note)
          : ok(undefined);

        if (
          fieldIdOrError.isErr() ||
          typeOrError.isErr() ||
          noteOrError.isErr()
        ) {
          return err(
            new CreateAndPublishAnnotationsFromTemplateErrors.AnnotationCreationFailed(
              "Invalid annotation properties"
            )
          );
        }

        // Create annotation value
        const valueOrError = AnnotationValueFactory.create({
          type: typeOrError.value,
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
          note: noteOrError.value,
          annotationTemplateIds: [templateId],
        });

        if (annotationOrError.isErr()) {
          return err(
            new CreateAndPublishAnnotationsFromTemplateErrors.AnnotationCreationFailed(
              annotationOrError.error.message || "Failed to create annotation"
            )
          );
        }

        annotations.push(annotationOrError.value);
      }

      // Create AnnotationsFromTemplate aggregate to enforce invariants
      try {
        const annotationsFromTemplate = AnnotationsFromTemplate.create({
          annotations,
          template,
          curatorId,
          createdAt: new Date(),
        });
      } catch (error: any) {
        return err(
          new CreateAndPublishAnnotationsFromTemplateErrors.AnnotationCreationFailed(
            error.message || "Annotations do not satisfy template requirements"
          )
        );
      }

      // Publish and save each annotation
      const publishedAnnotationIds: string[] = [];

      for (const annotation of annotations) {
        // Publish annotation
        const publishResult = await this.annotationPublisher.publish(annotation);
        if (publishResult.isErr()) {
          return err(
            new CreateAndPublishAnnotationsFromTemplateErrors.AnnotationPublishFailed(
              annotation.id.toString(),
              publishResult.error.message
            )
          );
        }

        // Mark as published and save
        annotation.markAsPublished(publishResult.value);

        try {
          await this.annotationRepository.save(annotation);
          publishedAnnotationIds.push(annotation.annotationId.getStringValue());
        } catch (error: any) {
          return err(
            new CreateAndPublishAnnotationsFromTemplateErrors.AnnotationSaveFailed(
              annotation.id.toString(),
              error.message
            )
          );
        }
      }

      return ok({ annotationIds: publishedAnnotationIds });
    } catch (error: any) {
      return err(new AppError.UnexpectedError(error));
    }
  }
}
