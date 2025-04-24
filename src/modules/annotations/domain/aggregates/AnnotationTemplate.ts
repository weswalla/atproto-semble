import { AggregateRoot } from "../../../../shared/domain/AggregateRoot";
import { UniqueEntityID } from "../../../../shared/domain/UniqueEntityID";
import { Result } from "../../../../shared/core/Result";
import { Guard, IGuardArgument } from "../../../../shared/core/Guard";
import { Result, ok, err, combine } from "../../../../shared/core/Result"; // Import Result types
import { Guard, IGuardArgument } from "../../../../shared/core/Guard";
import {
  AnnotationTemplateId,
  AnnotationTemplateName,
  AnnotationTemplateDescription,
  CuratorId,
  PublishedRecordId,
  AnnotationTemplateField,
  // AnnotationTemplateFields, // No longer used directly in props
  AnnotationFieldName,
  AnnotationFieldDescription,
  AnnotationType,
  AnnotationFieldDefinitionBase,
  AnnotationFieldId,
} from "../value-objects";
import { AnnotationField } from "./AnnotationField"; // Import AnnotationField aggregate

// Input DTO for field creation within the template factory
// Duplicates the one in the use case, consider moving to a shared location if used elsewhere
interface AnnotationTemplateFieldInputDTO {
  name: string;
  description: string;
  type: string;
  definition: any;
  required?: boolean;
}

export interface AnnotationTemplateProps {
  curatorId: CuratorId;
  name: AnnotationTemplateName;
  description: AnnotationTemplateDescription;
  // Store fields directly or manage them internally
  fields: AnnotationField[]; // Store the actual field aggregates
  fieldLinks: Map<string, AnnotationTemplateField>; // Map fieldId string to link (for required status)
  createdAt?: Date;
  publishedRecordId?: PublishedRecordId;
}

// Type for the create method props, accepting raw field DTOs
export interface AnnotationTemplateCreateProps {
  curatorId: CuratorId;
  name: AnnotationTemplateName;
  description: AnnotationTemplateDescription;
  fields: AnnotationTemplateFieldInputDTO[]; // Accept DTOs here
  createdAt?: Date;
  publishedRecordId?: PublishedRecordId;
}

export class AnnotationTemplate extends AggregateRoot<AnnotationTemplateProps> {
  get templateId(): AnnotationTemplateId {
    // Assuming AnnotationTemplateId.create takes UniqueEntityID
    return AnnotationTemplateId.create(this._id).getValue();
  }

  get curatorId(): CuratorId {
    return this.props.curatorId;
  }

  get name(): AnnotationTemplateName {
    return this.props.name;
  }

  get description(): AnnotationTemplateDescription {
    return this.props.description;
  }

  // Method to get the actual AnnotationField instances
  getFields(): AnnotationField[] {
    return [...this.props.fields]; // Return a copy
  }

  // Method to get the field links (containing 'required' status)
  getFieldLinks(): AnnotationTemplateField[] {
    return Array.from(this.props.fieldLinks.values());
  }

  // Method to get specific field link by ID
  getFieldLink(fieldId: AnnotationFieldId): AnnotationTemplateField | undefined {
    return this.props.fieldLinks.get(fieldId.getStringValue());
  }

  get createdAt(): Date {
    // Guaranteed by the create method's default
    return this.props.createdAt!;
  }

  get publishedRecordId(): PublishedRecordId | undefined {
    return this.props.publishedRecordId;
  }

  public updatePublishedRecordId(publishedRecordId: PublishedRecordId): void {
    this.props.publishedRecordId = publishedRecordId;
  }

  private constructor(props: AnnotationTemplateProps, id?: UniqueEntityID) {
    super(props, id);
  }

  // Factory method now takes DTOs and creates fields internally
  public static create(
    props: AnnotationTemplateCreateProps, // Use the new create props type
    id?: UniqueEntityID,
  ): Result<AnnotationTemplate> {
    const guardArgs: IGuardArgument[] = [
      { argument: props.curatorId, argumentName: 'curatorId' },
      { argument: props.name, argumentName: 'name' },
      { argument: props.description, argumentName: 'description' },
      { argument: props.fields, argumentName: 'fields' }, // Check if fields array is provided
    ];

    const guardResult = Guard.againstNullOrUndefinedBulk(guardArgs);
    if (!guardResult.isSuccess) {
      return err(new Error(guardResult.getErrorValue())); // Use err()
    }

    if (!Array.isArray(props.fields) || props.fields.length === 0) {
      return err(new Error('Annotation template must have at least one field.'));
    }

    const createdFields: AnnotationField[] = [];
    const fieldLinksMap = new Map<string, AnnotationTemplateField>();

    // Create AnnotationField aggregates from DTOs
    for (const fieldDTO of props.fields) {
      const fieldNameOrError = AnnotationFieldName.create(fieldDTO.name);
      const fieldDescOrError = AnnotationFieldDescription.create(
        fieldDTO.description,
      );
      const fieldTypeOrError = AnnotationType.create(fieldDTO.type);
      const fieldDefOrError = AnnotationFieldDefinitionBase.create(
        fieldDTO.definition,
      ); // Assuming this static method exists

      const combinedFieldProps = combine([
        fieldNameOrError,
        fieldDescOrError,
        fieldTypeOrError,
        fieldDefOrError,
      ]);

      if (combinedFieldProps.isErr()) {
        return err(
          new Error(
            `Failed to create value objects for field "${fieldDTO.name}": ${combinedFieldProps.error.message}`,
          ),
        );
      }

      const [fieldName, fieldDescription, fieldType, fieldDefinition] =
        combinedFieldProps.value;

      // Create the AnnotationField aggregate
      const fieldOrError = AnnotationField.create({
        curatorId: props.curatorId, // Use the template's curatorId
        name: fieldName,
        description: fieldDescription,
        definition: fieldDefinition,
        // createdAt will be set by AnnotationField.create
        // publishedRecordId is initially undefined
      });

      if (fieldOrError.isErr()) {
        return err(
          new Error(
            `Failed to create AnnotationField "${fieldDTO.name}": ${fieldOrError.error.message}`,
          ),
        );
      }
      const field = fieldOrError.value;
      createdFields.push(field);

      // Create the AnnotationTemplateField link
      const templateFieldOrError = AnnotationTemplateField.create({
        annotationFieldId: field.fieldId,
        required: fieldDTO.required ?? false,
      });

      if (templateFieldOrError.isErr()) {
        // Should not happen if fieldId is valid, but check anyway
        return err(
          new Error(
            `Failed to create field link for "${fieldDTO.name}": ${templateFieldOrError.error.message}`,
          ),
        );
      }
      fieldLinksMap.set(
        field.fieldId.getStringValue(),
        templateFieldOrError.value,
      );
    }

    // Ensure field names are unique within the template
    const fieldNames = createdFields.map((f) => f.name.value);
    if (new Set(fieldNames).size !== fieldNames.length) {
      return err(new Error('Field names within a template must be unique.'));
    }

    const aggregateProps: AnnotationTemplateProps = {
      curatorId: props.curatorId,
      name: props.name,
      description: props.description,
      fields: createdFields, // Store the created field aggregates
      fieldLinks: fieldLinksMap, // Store the links map
      createdAt: props.createdAt || new Date(),
      publishedRecordId: props.publishedRecordId,
    };

    const annotationTemplate = new AnnotationTemplate(aggregateProps, id);

    // Optionally: Add domain event for AnnotationTemplateCreated

    return ok(annotationTemplate); // Use ok()
  }

  // --- Methods for business logic ---

  // Method to update the published record ID of a specific field
  public updateFieldPublishedRecordId(
    fieldId: AnnotationFieldId,
    publishedRecordId: PublishedRecordId,
  ): Result<void> {
    const field = this.props.fields.find((f) => f.fieldId.equals(fieldId));
    if (!field) {
      return err(
        new Error(
          `Field with ID ${fieldId.getStringValue()} not found in this template.`,
        ),
      );
    }
    // Assuming AnnotationField has a method to update its ID
    field.updatePublishedRecordId(publishedRecordId);
    // Optionally add domain event: TemplateFieldPublishedIdUpdated
    return ok(undefined);
  }

  // Method to update name (keep existing)
  public updateName(newName: AnnotationTemplateName): Result<void> {
    this.props.name = newName;
    // Optionally add domain event: TemplateNameUpdated
    return Result.ok<void>();
  }

  // Method to update description
  public updateDescription(
    newDescription: AnnotationTemplateDescription
  ): Result<void> {
    this.props.description = newDescription;
    // Optionally add domain event: TemplateDescriptionUpdated
    return Result.ok<void>();
  }

  // Potentially methods to reorder fields, update 'required' status on a field, etc.
}
