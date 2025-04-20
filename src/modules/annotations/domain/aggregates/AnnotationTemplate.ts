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
  AnnotationTemplateFields,
} from "../value-objects";

export interface AnnotationTemplateProps {
  curatorId: CuratorId;
  name: AnnotationTemplateName;
  description: AnnotationTemplateDescription;
  annotationFields: AnnotationTemplateFields;
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

  get annotationFields(): AnnotationTemplateFields {
    // Return the collection instance itself
    return this.props.annotationFields;
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

    const aggregateProps: AnnotationTemplateProps = {
      curatorId: props.curatorId,
      name: props.name,
      description: props.description,
      annotationFields: props.annotationFields,
      createdAt: props.createdAt || new Date(),
      publishedRecordId: props.publishedRecordId,
    };

    const annotationTemplate = new AnnotationTemplate(aggregateProps, id);

    // Optionally: Add domain event for AnnotationTemplateCreated

    return Result.ok<AnnotationTemplate>(annotationTemplate);
  }

  // --- Methods for business logic ---

  // Method to add a field
  public addField(field: AnnotationTemplateField): Result<void> {
    const result = this.props.annotationFields.add(field);

    if (result.isFailure) {
      return Result.fail<void>(result.getErrorValue());
    }

    // Update the aggregate's state with the new immutable collection
    this.props.annotationFields = result.getValue();
    // Optionally add domain event: TemplateFieldAdded
    return Result.ok<void>();
  }

  // Method to remove a field by its AnnotationFieldId
  public removeField(fieldIdToRemove: UniqueEntityID): Result<void> {
    const result = this.props.annotationFields.remove(fieldIdToRemove);

    if (result.isFailure) {
      return Result.fail<void>(result.getErrorValue());
    }

    // Update the aggregate's state with the new immutable collection
    this.props.annotationFields = result.getValue();

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
