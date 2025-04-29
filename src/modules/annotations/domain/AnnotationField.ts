import { UniqueEntityID } from "../../../shared/domain/UniqueEntityID";
import { ok, Result, err } from "../../../shared/core/Result";
import { Guard, IGuardArgument } from "../../../shared/core/Guard";
import { AnnotationFieldId } from "./value-objects/AnnotationFieldId"; // Assuming this exists and wraps UniqueEntityID
import { AnnotationFieldName } from "./value-objects/AnnotationFieldName";
import { AnnotationFieldDescription } from "./value-objects/AnnotationFieldDescription";
import { AnnotationFieldDefinition } from "./value-objects/AnnotationFieldDefinition"; // Renamed and refactored
import { CuratorId, PublishedRecordId } from "./value-objects";
import { Entity } from "../../../shared/domain/Entity";

export interface AnnotationFieldProps {
  curatorId: CuratorId;
  name: AnnotationFieldName;
  description: AnnotationFieldDescription;
  definition: AnnotationFieldDefinition;
  createdAt?: Date;
  publishedRecordId?: PublishedRecordId;
}

export class AnnotationField extends Entity<AnnotationFieldProps> {
  get fieldId(): AnnotationFieldId {
    return AnnotationFieldId.create(this._id).unwrap();
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

  public isPublished(): boolean {
    return this.props.publishedRecordId !== undefined;
  }

  public markAsPublished(publishedRecordId: PublishedRecordId): void {
    this.props.publishedRecordId = publishedRecordId;
  }

  private constructor(props: AnnotationFieldProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public clone(): AnnotationField {
    return new AnnotationField(
      {
        ...this.props,
        createdAt: this.props.createdAt,
      },
      this._id
    );
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

    if (guardResult.isErr()) {
      // Use err() and ensure error is an Error instance
      return err(new Error(guardResult.error));
    }

    const defaultValues: AnnotationFieldProps = {
      ...props,
      createdAt: props.createdAt || new Date(),
    };

    const annotationField = new AnnotationField(defaultValues, id);

    return ok(annotationField);
  }
}
