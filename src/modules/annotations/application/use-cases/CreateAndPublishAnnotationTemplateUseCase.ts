import { UseCase } from '../../../../shared/core/UseCase';
import { IAnnotationTemplateRepository } from '../repositories/IAnnotationTemplateRepository';
import { IAnnotationFieldRepository } from '../repositories/IAnnotationFieldRepository';
import { IAnnotationTemplatePublisher } from '../ports/IAnnotationTemplatePublisher';
import { IAnnotationFieldPublisher } from '../ports/IAnnotationFieldPublisher';
import { Result, left, right, combine } from '../../../../shared/core/Result';
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

// Define potential specific errors for this use case
export namespace CreateAndPublishAnnotationTemplateErrors {
  export class FieldCreationFailed extends Result<UseCaseError> {
    constructor(fieldName: string, error: string) {
      super(false, `Failed to create field "${fieldName}": ${error}`);
    }
  }

  export class FieldPublishFailed extends Result<UseCaseError> {
    constructor(fieldId: string, error: string) {
      super(false, `Failed to publish field "${fieldId}": ${error}`);
    }
  }

  export class FieldSaveFailed extends Result<UseCaseError> {
    constructor(fieldId: string, error: string) {
      super(false, `Failed to save field "${fieldId}": ${error}`);
    }
  }

  export class TemplateCreationFailed extends Result<UseCaseError> {
    constructor(error: string) {
      super(false, `Failed to create template: ${error}`);
    }
  }

  export class TemplatePublishFailed extends Result<UseCaseError> {
    constructor(templateId: string, error: string) {
      super(false, `Failed to publish template "${templateId}": ${error}`);
    }
  }

  export class TemplateSaveFailed extends Result<UseCaseError> {
    constructor(templateId: string, error: string) {
      super(false, `Failed to save template "${templateId}": ${error}`);
    }
  }
}

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
  | AppError.UnexpectedError
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
      if (combinedProps.isFailure) {
        return left(
          new CreateAndPublishAnnotationTemplateErrors.TemplateCreationFailed(
            combinedProps.error,
          ),
        );
      }
      const curatorId = curatorIdOrError.getValue();
      const templateName = templateNameOrError.getValue();
      const templateDescription = templateDescOrError.getValue();

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

        if (combinedFieldProps.isFailure) {
          return left(
            new CreateAndPublishAnnotationTemplateErrors.FieldCreationFailed(
              fieldDTO.name,
              combinedFieldProps.error,
            ),
          );
        }

        const fieldName = fieldNameOrError.getValue();
        const fieldDescription = fieldDescOrError.getValue();
        const fieldType = fieldTypeOrError.getValue();
        const fieldDefinition = fieldDefOrError.getValue();

        const fieldOrError = AnnotationField.create({
          curatorId,
          name: fieldName,
          description: fieldDescription,
          type: fieldType,
          definition: fieldDefinition,
          // publishedRecordId will be set after publishing
        });

        if (fieldOrError.isFailure) {
          return left(
            new CreateAndPublishAnnotationTemplateErrors.FieldCreationFailed(
              fieldDTO.name,
              fieldOrError.error.toString(),
            ),
          );
        }
        const field = fieldOrError.getValue();
        const fieldIdString = field.fieldId.getStringValue();

        // Publish field
        const publishResult = await this.annotationFieldPublisher.publish(field);
        if (publishResult.isFailure) {
          return left(
            new CreateAndPublishAnnotationTemplateErrors.FieldPublishFailed(
              fieldIdString,
              publishResult.error.message,
            ),
          );
        }
        const publishedRecordId = publishResult.getValue();

        // Update field with publishedRecordId
        field.setPublishedRecordId(publishedRecordId);

        // Save field
        try {
          await this.annotationFieldRepository.save(field);
        } catch (err: any) {
          return left(
            new CreateAndPublishAnnotationTemplateErrors.FieldSaveFailed(
              fieldIdString,
              err.message,
            ),
          );
        }

        createdFields.push(field);

        // Create AnnotationTemplateField value object
        const templateFieldOrError = AnnotationTemplateField.create({
          annotationFieldId: field.fieldId,
          required: fieldDTO.required ?? false, // Default required to false if not provided
        });

        if (templateFieldOrError.isFailure) {
          // This should ideally not fail if fieldId is valid
          return left(
            new CreateAndPublishAnnotationTemplateErrors.TemplateCreationFailed(
              `Failed to create template field link for ${fieldDTO.name}: ${templateFieldOrError.error}`,
            ),
          );
        }
        templateFields.push(templateFieldOrError.getValue());
      }

      // 2. Create AnnotationTemplate
      const annotationTemplateFieldsOrError = AnnotationTemplateFields.create({
        fields: templateFields,
      });
      if (annotationTemplateFieldsOrError.isFailure) {
        return left(
          new CreateAndPublishAnnotationTemplateErrors.TemplateCreationFailed(
            annotationTemplateFieldsOrError.error,
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

      if (templateOrError.isFailure) {
        return left(
          new CreateAndPublishAnnotationTemplateErrors.TemplateCreationFailed(
            templateOrError.error.toString(),
          ),
        );
      }
      const template = templateOrError.getValue();
      const templateId = template.templateId; // Get the ID before potential modification
      const templateIdString = templateId.getStringValue();

      // 3. Publish Template
      const publishResult =
        await this.annotationTemplatePublisher.publish(template);
      if (publishResult.isFailure) {
        return left(
          new CreateAndPublishAnnotationTemplateErrors.TemplatePublishFailed(
            templateIdString,
            publishResult.error.message,
          ),
        );
      }
      const publishedRecordId = publishResult.getValue();

      // 4. Update Template with publishedRecordId
      template.setPublishedRecordId(publishedRecordId);

      // 5. Save Template
      try {
        await this.annotationTemplateRepository.save(template);
      } catch (err: any) {
        return left(
          new CreateAndPublishAnnotationTemplateErrors.TemplateSaveFailed(
            templateIdString,
            err.message,
          ),
        );
      }

      // 6. Return Success
      return right({ templateId: templateIdString });
    } catch (err: any) {
      return left(new AppError.UnexpectedError(err));
    }
  }
}
