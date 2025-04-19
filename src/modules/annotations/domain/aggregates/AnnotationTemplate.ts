import { AggregateRoot } from "../../../../shared/domain/AggregateRoot";
import { UniqueEntityID } from "../../../../shared/domain/UniqueEntityID";
import { Result } from "../../../../shared/core/Result";
import { Guard, IGuardArgument } from "../../../../shared/core/Guard";
import {
  AnnotationTemplateId,
  AnnotationTemplateName,
  AnnotationTemplateDescription,
  CuratorId,
  PublishedRecordId,
  AnnotationTemplateField,
} from "../value-objects"; // Import necessary value objects

// Properties required to construct an AnnotationTemplate
export interface AnnotationTemplateProps {
  curatorId: CuratorId;
  name: AnnotationTemplateName;
  description: AnnotationTemplateDescription;
  annotationFields: AnnotationTemplateField[]; // Assuming TemplateField is already a ValueObject
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

  get annotationFields(): AnnotationTemplateField[] {
    // Return a copy to prevent external modification if TemplateField is mutable
    // If TemplateField is an immutable ValueObject, direct return is fine.
    return [...this.props.annotationFields];
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

  public static create(
    props: AnnotationTemplateProps,
    id?: UniqueEntityID
  ): Result<AnnotationTemplate> {
    const guardArgs: IGuardArgument[] = [
      { argument: props.curatorId, argumentName: "curatorId" },
      { argument: props.name, argumentName: "name" },
      { argument: props.description, argumentName: "description" },
      { argument: props.annotationFields, argumentName: "annotationFields" },
    ];

    const guardResult = Guard.againstNullOrUndefinedBulk(guardArgs);

    if (guardResult.isFailure) {
      return Result.fail<AnnotationTemplate>(guardResult.getErrorValue());
    }

    // Additional validation specific to AnnotationTemplate
    if (!props.annotationFields || props.annotationFields.length === 0) {
      return Result.fail<AnnotationTemplate>(
        "AnnotationTemplate must include at least one field."
      );
    }
    // Could add validation for duplicate fields here if needed

    const defaultValues: AnnotationTemplateProps = {
      ...props,
      createdAt: props.createdAt || new Date(),
      publishedRecordId: props.publishedRecordId,
    };

    const annotationTemplate = new AnnotationTemplate(defaultValues, id);

    // Optionally: Add domain event for AnnotationTemplateCreated

    return Result.ok<AnnotationTemplate>(annotationTemplate);
  }

  // --- Methods for business logic ---

  // Method to add a field (example of behavior)
  public addField(field: AnnotationTemplateField): Result<void> {
    // Check if field already exists (assuming TemplateField has an equals method or unique ID)
    const fieldExists = this.props.annotationFields.some(
      (existingField) => existingField.equals(field) // Adjust based on TemplateField's comparison logic
    );

    if (fieldExists) {
      return Result.fail<void>("Field already exists in the template.");
    }

    this.props.annotationFields.push(field);
    // Optionally add domain event: TemplateFieldAdded
    return Result.ok<void>();
  }

  // Method to remove a field by its AnnotationFieldId
  public removeField(fieldIdToRemove: UniqueEntityID): Result<void> {
    const initialLength = this.props.annotationFields.length;
    this.props.annotationFields = this.props.annotationFields.filter(
      (field) => !field.annotationFieldId.getValue().equals(fieldIdToRemove) // Compare UniqueEntityIDs
    );

    if (this.props.annotationFields.length === initialLength) {
      return Result.fail<void>("Field not found in the template.");
    }

    if (this.props.annotationFields.length === 0) {
      return Result.fail<void>(
        "Cannot remove the last field from the template."
      );
    }

    // Optionally add domain event: TemplateFieldRemoved
    return Result.ok<void>();
  }

  // Method to update name
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
