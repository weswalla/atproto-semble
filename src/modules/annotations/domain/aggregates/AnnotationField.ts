import { AggregateRoot } from "../../../../shared/domain/AggregateRoot";
import { UniqueEntityID } from "../../../../shared/domain/UniqueEntityID";
import { Result } from "../../../../shared/core/Result";
import { Guard, IGuardArgument } from "../../../../shared/core/Guard";
import { AnnotationFieldId } from "../value-objects/AnnotationFieldId"; // Assuming this exists and wraps UniqueEntityID
import { AnnotationFieldName } from "../value-objects/AnnotationFieldName";
import { AnnotationFieldDescription } from "../value-objects/AnnotationFieldDescription";
import { AnnotationFieldDefinition } from "../value-objects/AnnotationFieldDefinition"; // Renamed and refactored
import { CuratorId, PublishedRecordId } from "../value-objects";

// Properties required to construct an AnnotationField
export interface AnnotationFieldProps {
  curatorId: CuratorId;
  name: AnnotationFieldName;
  description: AnnotationFieldDescription;
  definition: AnnotationFieldDefinition;
  createdAt?: Date;
  publishedRecordId?: PublishedRecordId;
}

export class AnnotationField extends AggregateRoot<AnnotationFieldProps> {
  get fieldId(): AnnotationFieldId {
    return AnnotationFieldId.create(this._id).getValue();
  }

  get curatorId(): CuratorId {
    return this.props.curatorId;
  }

  get name(): AnnotationFieldName {
    return this.props.name;
  }

  get description(): AnnotationFieldDescription {
    return this.props.description;
  }

  get definition(): AnnotationFieldDefinition {
    return this.props.definition;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get publishedRecordId(): PublishedRecordId | undefined {
    return this.props.publishedRecordId;
  }

  public updatePublishedRecordId(publishedRecordId: PublishedRecordId): void {
    this.props.publishedRecordId = publishedRecordId;
  }

  private constructor(props: AnnotationFieldProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: AnnotationFieldProps,
    id?: UniqueEntityID
  ): Result<AnnotationField> {
    const guardArgs: IGuardArgument[] = [
      { argument: props.name, argumentName: "name" },
      { argument: props.description, argumentName: "description" },
      { argument: props.definition, argumentName: "definition" },
    ];

    const guardResult = Guard.againstNullOrUndefinedBulk(guardArgs);

    if (guardResult.isFailure) {
      return Result.fail<AnnotationField>(guardResult.getErrorValue());
    }

    const defaultValues: AnnotationFieldProps = {
      ...props,
      createdAt: props.createdAt || new Date(),
    };

    const annotationField = new AnnotationField(defaultValues, id);

    // Optionally: Add domain event for AnnotationFieldCreated

    return Result.ok<AnnotationField>(annotationField);
  }

  // Methods for business logic related to AnnotationField
  // e.g., updateDescription(newDescription: AnnotationFieldDescription): Result<void>
  // e.g., updateDefinition(newDefinition: AnnotationFieldDefinition): Result<void> - careful with type changes!
}
