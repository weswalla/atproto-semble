import { UseCase } from '../../../../shared/core/UseCase';
import { IAnnotationTemplateRepository } from '../repositories/IAnnotationTemplateRepository';
import { IAnnotationFieldRepository } from '../repositories/IAnnotationFieldRepository';
import { IAnnotationTemplatePublisher } from '../ports/IAnnotationTemplatePublisher';
import { IAnnotationFieldPublisher } from '../ports/IAnnotationFieldPublisher';
import { Result, ok, err, combine } from '../../../../shared/core/Result'; // Updated imports
import { AppError } from '../../../../shared/core/AppError';
import { UseCaseError } from '../../../../shared/core/UseCaseError';
import { AnnotationTemplate } from '../../domain/aggregates/AnnotationTemplate';
import { AnnotationField } from '../../domain/aggregates/AnnotationField';
import { CuratorId } from '../../domain/value-objects/CuratorId';
import { AnnotationTemplateName } from '../../domain/value-objects/AnnotationTemplateName';
import { AnnotationTemplateDescription } from '../../domain/value-objects/AnnotationTemplateDescription';
import { AnnotationFieldName } from '../../domain/value-objects/AnnotationFieldName';
import { AnnotationFieldDescription } from '../../domain/value-objects/AnnotationFieldDescription';
import { AnnotationType } from '../../domain/value-objects/AnnotationType';
import { AnnotationDefinition } from '../../domain/value-objects/AnnotationDefinition';
import { AnnotationTemplateField } from '../../domain/value-objects/AnnotationTemplateField';
import { AnnotationTemplateFields } from '../../domain/value-objects/AnnotationTemplateFields';
import { UniqueEntityID } from '../../../../shared/domain/UniqueEntityID';
import { AnnotationTemplateId } from '../../domain/value-objects/AnnotationTemplateId';
import { CreateAndPublishAnnotationTemplateErrors } from './errors'; // Import from errors file

// Input DTO structure based on the test builder
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
    private readonly annotationFieldRepository: IAnnotationFieldRepository,
    private readonly annotationTemplatePublisher: IAnnotationTemplatePublisher,
    private readonly annotationFieldPublisher: IAnnotationFieldPublisher,
  ) {}

  async execute(
    request: CreateAndPublishAnnotationTemplateDTO,
  ): Promise<CreateAndPublishAnnotationTemplateResponse> {
    try {
      const curatorIdOrError = CuratorId.create(request.curatorId);
      const templateNameOrError = AnnotationTemplateName.create({
        value: request.name,
      });
      const templateDescOrError = AnnotationTemplateDescription.create({
        value: request.description,
      });

      const combinedProps = combine([
        curatorIdOrError,
        templateNameOrError,
        templateDescOrError,
      ]);
      // Use the new Result type check
      if (combinedProps.isErr()) {
        // Return err with the specific error instance
        return err(
          new CreateAndPublishAnnotationTemplateErrors.TemplateCreationFailed(
            combinedProps.error.message, // Assuming error has a message property
          ),
        );
      }
      // Values are in an array if combine succeeds
      const [curatorId, templateName, templateDescription] = combinedProps.value;

      // 1. Create, Publish, and Save Fields
      const createdFields: AnnotationField[] = [];
      const templateFields: AnnotationTemplateField[] = [];

      for (const fieldDTO of request.fields) {
        const fieldNameOrError = AnnotationFieldName.create({
          value: fieldDTO.name,
        });
        const fieldDescOrError = AnnotationFieldDescription.create({
          value: fieldDTO.description,
        });
        const fieldTypeOrError = AnnotationType.create(fieldDTO.type);
        // Assuming AnnotationDefinition can be created directly for now
        const fieldDefOrError = AnnotationDefinition.create(fieldDTO.definition);

        const combinedFieldProps = combine([
          fieldNameOrError,
          fieldDescOrError,
          fieldTypeOrError,
          fieldDefOrError,
        ]);

        if (combinedFieldProps.isErr()) {
          return err(
            new CreateAndPublishAnnotationTemplateErrors.FieldCreationFailed(
              fieldDTO.name,
              combinedFieldProps.error.message, // Assuming error has a message property
            ),
          );
        }

        // Values are in an array if combine succeeds
        const [fieldName, fieldDescription, fieldType, fieldDefinition] =
          combinedFieldProps.value;

        const fieldOrError = AnnotationField.create({
          curatorId,
          name: fieldName,
          description: fieldDescription,
          type: fieldType,
          definition: fieldDefinition,
          // publishedRecordId will be set after publishing
        });

        if (fieldOrError.isErr()) {
          return err(
            new CreateAndPublishAnnotationTemplateErrors.FieldCreationFailed(
              fieldDTO.name,
              fieldOrError.error.message, // Assuming error has a message property
            ),
          );
        }
        const field = fieldOrError.value;
        const fieldIdString = field.fieldId.getStringValue();

        // Publish field
        const publishResult = await this.annotationFieldPublisher.publish(field);
        if (publishResult.isErr()) {
          return err(
            new CreateAndPublishAnnotationTemplateErrors.FieldPublishFailed(
              fieldIdString,
              publishResult.error.message, // Assuming error has a message property
            ),
          );
        }
        const publishedRecordId = publishResult.value;

        // Update field with publishedRecordId
        field.setPublishedRecordId(publishedRecordId);

        // Save field
        try {
          await this.annotationFieldRepository.save(field);
        } catch (error: any) {
          return err(
            new CreateAndPublishAnnotationTemplateErrors.FieldSaveFailed(
              fieldIdString,
              error.message,
            ),
          );
        }

        createdFields.push(field);

        // Create AnnotationTemplateField value object
        const templateFieldOrError = AnnotationTemplateField.create({
          annotationFieldId: field.fieldId,
          required: fieldDTO.required ?? false, // Default required to false if not provided
        });

        if (templateFieldOrError.isErr()) {
          // This should ideally not fail if fieldId is valid
          return err(
            new CreateAndPublishAnnotationTemplateErrors.TemplateCreationFailed(
              `Failed to create template field link for ${fieldDTO.name}: ${templateFieldOrError.error.message}`, // Assuming error has a message property
            ),
          );
        }
        templateFields.push(templateFieldOrError.value);
      }

      // 2. Create AnnotationTemplate
      const annotationTemplateFieldsOrError = AnnotationTemplateFields.create({
        fields: templateFields,
      });
      if (annotationTemplateFieldsOrError.isErr()) {
        return err(
          new CreateAndPublishAnnotationTemplateErrors.TemplateCreationFailed(
            annotationTemplateFieldsOrError.error.message, // Assuming error has a message property
          ),
        );
      }

      const templateOrError = AnnotationTemplate.create({
        curatorId,
        name: templateName,
        description: templateDescription,
        annotationFields: annotationTemplateFieldsOrError.getValue(),
        // publishedRecordId will be set after publishing
      });

      if (templateOrError.isErr()) {
        return err(
          new CreateAndPublishAnnotationTemplateErrors.TemplateCreationFailed(
            templateOrError.error.message, // Assuming error has a message property
          ),
        );
      }
      const template = templateOrError.value;
      const templateId = template.templateId; // Get the ID before potential modification
      const templateIdString = templateId.getStringValue();

      // 3. Publish Template
      const publishResult =
        await this.annotationTemplatePublisher.publish(template);
      if (publishResult.isErr()) {
        return err(
          new CreateAndPublishAnnotationTemplateErrors.TemplatePublishFailed(
            templateIdString,
            publishResult.error.message, // Assuming error has a message property
          ),
        );
      }
      const publishedRecordId = publishResult.value;

      // 4. Update Template with publishedRecordId
      template.setPublishedRecordId(publishedRecordId);

      // 5. Save Template
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

      // 6. Return Success
      return ok({ templateId: templateIdString }); // Use ok for success
    } catch (error: any) {
      // Catch unexpected errors and wrap them
      return err(new AppError.UnexpectedError(error));
    }
  }
}
