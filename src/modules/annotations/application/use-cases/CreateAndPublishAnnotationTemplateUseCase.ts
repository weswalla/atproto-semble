import { UseCase } from "../../../../shared/core/UseCase";
import { IAnnotationTemplateRepository } from "../repositories/IAnnotationTemplateRepository";
import { IAnnotationTemplatePublisher } from "../ports/IAnnotationTemplatePublisher";
import { IAnnotationFieldPublisher } from "../ports/IAnnotationFieldPublisher";
import { Result, ok, err } from "../../../../shared/core/Result"; // Updated imports
import { AppError } from "../../../../shared/core/AppError";
import { AnnotationTemplate } from "../../domain/aggregates/AnnotationTemplate";
import { CreateAndPublishAnnotationTemplateErrors } from "./errors"; // Import from errors file
import {
  AnnotationTemplateDescription,
  AnnotationTemplateFieldInputDTO,
  AnnotationTemplateFields,
  AnnotationTemplateName,
  CuratorId,
} from "../../domain/value-objects";
import { AnnotationField } from "../../domain/aggregates";

export interface CreateAndPublishAnnotationTemplateDTO {
  curatorId: string;
  name: string;
  description: string;
  fields: AnnotationTemplateFieldInputDTO[];
}

// Define the response type
export type CreateAndPublishAnnotationTemplateResponse = Result<
  { templateId: string }, // Success returns the template ID
  | CreateAndPublishAnnotationTemplateErrors.FieldCreationFailed
  | CreateAndPublishAnnotationTemplateErrors.FieldPublishFailed
  | CreateAndPublishAnnotationTemplateErrors.FieldSaveFailed
  | CreateAndPublishAnnotationTemplateErrors.TemplateCreationFailed
  | CreateAndPublishAnnotationTemplateErrors.TemplatePublishFailed
  | CreateAndPublishAnnotationTemplateErrors.TemplateSaveFailed
  | AppError.UnexpectedError // Keep AppError for unexpected issues
>;

export class CreateAndPublishAnnotationTemplateUseCase
  implements
    UseCase<
      CreateAndPublishAnnotationTemplateDTO,
      Promise<CreateAndPublishAnnotationTemplateResponse>
    >
{
  constructor(
    private readonly annotationTemplateRepository: IAnnotationTemplateRepository,
    private readonly annotationTemplatePublisher: IAnnotationTemplatePublisher,
    private readonly annotationFieldPublisher: IAnnotationFieldPublisher
  ) {}

  async execute(
    request: CreateAndPublishAnnotationTemplateDTO
  ): Promise<CreateAndPublishAnnotationTemplateResponse> {
    try {
      const curatorIdOrError = CuratorId.create(request.curatorId);
      const templateNameOrError = AnnotationTemplateName.create(request.name);
      const templateDescOrError = AnnotationTemplateDescription.create(
        request.description
      );
      const annotationTemplateFieldsOrError = AnnotationTemplateFields.fromDto({
        curatorId: request.curatorId,
        fields: request.fields,
      });

      if (
        curatorIdOrError.isErr() ||
        templateNameOrError.isErr() ||
        templateDescOrError.isErr() ||
        annotationTemplateFieldsOrError.isErr()
      ) {
        return err(
          new CreateAndPublishAnnotationTemplateErrors.FieldCreationFailed(
            "Invalid template properties",
            "Invalid template properties"
          )
        );
      }

      const curatorId = curatorIdOrError.value;
      const templateName = templateNameOrError.value;
      const templateDescription = templateDescOrError.value;
      const annotationTemplateFields = annotationTemplateFieldsOrError.value;

      const templateOrError = AnnotationTemplate.create({
        curatorId,
        name: templateName,
        description: templateDescription,
        annotationTemplateFields: annotationTemplateFields,
      });

      if (templateOrError.isErr()) {
        // Error could be from template props or internal field creation
        return err(
          new CreateAndPublishAnnotationTemplateErrors.TemplateCreationFailed(
            templateOrError.error.message
          )
        );
      }
      const template = templateOrError.value;
      const publishedAnnotationFields: AnnotationField[] = [];

      console.log("Creating and publishing annotation template with fields:");
      for (const annotationField of template.getAnnotationFields()) {
        const publishedFieldId =
          await this.annotationFieldPublisher.publish(annotationField);
        if (publishedFieldId.isErr()) {
          return err(
            new CreateAndPublishAnnotationTemplateErrors.FieldPublishFailed(
              annotationField.name.value,
              publishedFieldId.error.message
            )
          );
        }

        const annotationFieldCloned = annotationField.clone();
        annotationFieldCloned.markAsPublished(publishedFieldId.value);
        publishedAnnotationFields.push(annotationFieldCloned);
      }
      console.log(
        "Finished creating and publishing annotation template with fields:",
        JSON.stringify(publishedAnnotationFields)
      );

      for (const publishedField of publishedAnnotationFields) {
        const markAnnotationResult =
          template.markAnnotationTemplateFieldAsPublished(
            publishedField.fieldId,
            publishedField.publishedRecordId!
          );
        if (markAnnotationResult.isErr()) {
          return err(
            new CreateAndPublishAnnotationTemplateErrors.FieldSaveFailed(
              publishedField.name.value,
              markAnnotationResult.error.message
            )
          );
        }
      }
      if (template.hasUnpublishedFields()) {
        return err(
          new CreateAndPublishAnnotationTemplateErrors.FieldPublishFailed(
            "",
            "Some fields are not published"
          )
        );
      }

      const publishedTemplateIdResult =
        await this.annotationTemplatePublisher.publish(template);

      if (publishedTemplateIdResult.isErr()) {
        return err(
          new CreateAndPublishAnnotationTemplateErrors.TemplatePublishFailed(
            template.id.toString(),
            publishedTemplateIdResult.error.message
          )
        );
      }

      template.markAsPublished(publishedTemplateIdResult.value);

      await this.annotationTemplateRepository.save(template);

      return ok({ templateId: template.id.toString() });
    } catch (error: any) {
      return err(new AppError.UnexpectedError(error));
    }
  }
}
