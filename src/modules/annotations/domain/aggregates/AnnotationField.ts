import { AggregateRoot } from "../../../../shared/domain/AggregateRoot";
import { UniqueEntityID } from "../../../../shared/domain/UniqueEntityID";
import { Result } from "../../../../shared/core/Result";
import { Guard, IGuardArgument } from "../../../../shared/core/Guard";
import { AnnotationFieldId } from "../value-objects/AnnotationFieldId"; // Assuming this exists and wraps UniqueEntityID
import { AnnotationFieldName } from "../value-objects/AnnotationFieldName";
import { AnnotationFieldDescription } from "../value-objects/AnnotationFieldDescription";
import { AnnotationFieldDefinition } from "../value-objects/AnnotationFieldDefinition"; // Renamed and refactored

// Properties required to construct an AnnotationField
export interface AnnotationFieldProps {
  name: AnnotationFieldName;
  description: AnnotationFieldDescription;
  definition: AnnotationFieldDefinition;
  createdAt?: Date; // Optional on creation, will default
  // Add other properties like owner DID, etc. if needed
}

export class AnnotationField extends AggregateRoot<AnnotationFieldProps> {

  get fieldId(): AnnotationFieldId {
    // Assuming AnnotationFieldId.create takes UniqueEntityID
    return AnnotationFieldId.create(this._id).getValue();
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
    // createdAt is guaranteed by the create method's default
    return this.props.createdAt!;
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

    // Additional validation can be done here on the value objects themselves if needed,
    // although their own `create` methods should handle internal consistency.

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
