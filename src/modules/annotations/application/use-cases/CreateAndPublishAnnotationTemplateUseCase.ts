import { UseCase } from "../../../../shared/core/UseCase";
import { IAnnotationTemplateRepository } from "../repositories/IAnnotationTemplateRepository";
import { IAnnotationFieldRepository } from "../repositories/IAnnotationFieldRepository";
import { IAnnotationTemplatePublisher } from "../ports/IAnnotationTemplatePublisher";
import { IAnnotationFieldPublisher } from "../ports/IAnnotationFieldPublisher";
import { Result, ok, err, combine } from "../../../../shared/core/Result"; // Updated imports
import { AppError } from "../../../../shared/core/AppError";
import { UseCaseError } from "../../../../shared/core/UseCaseError";
import { AnnotationTemplate } from "../../domain/aggregates/AnnotationTemplate";
import { AnnotationField } from '../../domain/aggregates/AnnotationField'; // Keep this
import { CreateAndPublishAnnotationTemplateErrors } from './errors'; // Import from errors file
import {
  AnnotationFieldDefinitionBase,
  AnnotationFieldDescription,
  AnnotationTemplateDescription,
  // AnnotationTemplateField, // No longer created directly here
  AnnotationTemplateName,
  CuratorId,
  PublishedRecordId, // Import PublishedRecordId
} from '../../domain/value-objects';
import { AnnotationFieldName } from '../../domain/value-objects/AnnotationFieldName';
import { AnnotationType } from '../../domain/value-objects/AnnotationType';
import { AnnotationTemplateId } from '../../domain/value-objects/AnnotationTemplateId'; // Import AnnotationTemplateId

// Input DTO structure (remains the same)
interface AnnotationTemplateFieldInputDTO {
  name: string;
  description: string;
  type: string;
  definition: any; // Consider defining specific types based on AnnotationType
  required?: boolean; // Assuming optional based on AnnotationTemplateField
}

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
    // private readonly annotationFieldRepository: IAnnotationFieldRepository, // No longer saving fields directly
    private readonly annotationTemplatePublisher: IAnnotationTemplatePublisher,
    private readonly annotationFieldPublisher: IAnnotationFieldPublisher, // Assuming this will be updated for publishMany
  ) {}

  async execute(
    request: CreateAndPublishAnnotationTemplateDTO
  ): Promise<CreateAndPublishAnnotationTemplateResponse> {
    try {
      // 1. Create Value Objects for Template properties
      const curatorIdOrError = CuratorId.create(request.curatorId);
      const templateNameOrError = AnnotationTemplateName.create(request.name);
      const templateDescOrError = AnnotationTemplateDescription.create(
        request.description,
      );

      const combinedProps = combine([
        curatorIdOrError,
        templateNameOrError,
        templateDescOrError,
      ]);

      if (combinedProps.isErr()) {
        return err(
          new CreateAndPublishAnnotationTemplateErrors.TemplateCreationFailed(
            `Invalid template properties: ${combinedProps.error.message}`,
          ),
        );
      }
      const [curatorId, templateName, templateDescription] =
        combinedProps.value;

      // 2. Create AnnotationTemplate Aggregate (which creates fields internally)
      const templateOrError = AnnotationTemplate.create({
        curatorId,
        name: templateName,
        description: templateDescription,
        fields: request.fields, // Pass the raw field DTOs
      });

      if (templateOrError.isErr()) {
        // Error could be from template props or internal field creation
        return err(
          new CreateAndPublishAnnotationTemplateErrors.TemplateCreationFailed(
            templateOrError.error.message,
          ),
        );
      }
      const template = templateOrError.value;
      const templateId = template.templateId; // Get ID early
      const templateIdString = templateId.getStringValue();

      // 3. Publish Annotation Fields
      const fieldsToPublish = template.getFields();
      if (fieldsToPublish.length === 0) {
        // Should have been caught by create, but double-check
        return err(
          new CreateAndPublishAnnotationTemplateErrors.TemplateCreationFailed(
            'Template has no fields to publish.',
          ),
        );
      }

      // --- ASSUMPTION: publishMany exists and works ---
      // const publishFieldsResult = await this.annotationFieldPublisher.publishMany(fieldsToPublish);
      // --- TEMPORARY: Publish one by one until interface is updated ---
      const publishedFieldResults = new Map<string, PublishedRecordId>();
      let fieldPublishError: UseCaseError | null = null;

      for (const field of fieldsToPublish) {
        const fieldIdStr = field.fieldId.getStringValue();
        const publishResult =
          await this.annotationFieldPublisher.publish(field);
        if (publishResult.isOk()) {
          publishedFieldResults.set(fieldIdStr, publishResult.value);
        } else {
          // If one fails, stop and return error for that field
          fieldPublishError =
            new CreateAndPublishAnnotationTemplateErrors.FieldPublishFailed(
              fieldIdStr,
              publishResult.error.message,
            );
          break; // Stop processing further fields
        }
      }

      // Check if any field failed to publish
      if (fieldPublishError) {
        return err(fieldPublishError);
      }
      // --- End Temporary Section ---

      // 4. Update Fields in Aggregate with PublishedRecordIds
      // If using publishMany that returns a map:
      // if (publishFieldsResult.isErr()) {
      //   return err(new CreateAndPublishAnnotationTemplateErrors.FieldPublishFailed('Multiple fields', publishFieldsResult.error.message));
      // }
      // const publishedFieldIdsMap = publishFieldsResult.value; // Assuming Map<string, PublishedRecordId>

      // Iterate through the results map (using temporary map for now)
      for (const [fieldIdStr, publishedRecordId] of publishedFieldResults) {
        const field = fieldsToPublish.find(
          (f) => f.fieldId.getStringValue() === fieldIdStr,
        );
        if (field) {
          const updateResult = template.updateFieldPublishedRecordId(
            field.fieldId,
            publishedRecordId,
          );
          if (updateResult.isErr()) {
            // Should not happen if field was found, but handle defensively
            return err(
              new AppError.UnexpectedError(
                `Failed to update published ID for field ${fieldIdStr} in aggregate: ${updateResult.error.message}`,
              ),
            );
          }
        } else {
          // This indicates a logic error - published ID received for a field not in the original list
          return err(
            new AppError.UnexpectedError(
              `Consistency error: Received published ID for unknown field ${fieldIdStr}`,
            ),
          );
        }
      }

      // 5. Publish Template Aggregate
      const publishTemplateResult =
        await this.annotationTemplatePublisher.publish(template);
      if (publishTemplateResult.isErr()) {
        return err(
          new CreateAndPublishAnnotationTemplateErrors.TemplatePublishFailed(
            templateIdString,
            publishTemplateResult.error.message,
          ),
        );
      }
      const templatePublishedRecordId = publishTemplateResult.value;

      // 6. Update Template Aggregate with its PublishedRecordId
      template.updatePublishedRecordId(templatePublishedRecordId);

      // 7. Save Template Aggregate (Repository handles fields)
      try {
        await this.annotationTemplateRepository.save(template);
      } catch (error: any) {
        return err(
          new CreateAndPublishAnnotationTemplateErrors.TemplateSaveFailed(
            templateIdString,
            error.message,
          ),
        );
      }

      // 8. Return Success
      return ok({ templateId: templateIdString });
    } catch (error: any) {
      // Catch unexpected errors
      return err(new AppError.UnexpectedError(error));
    }
  }
}
