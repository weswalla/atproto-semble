import { AggregateRoot } from "../../../../shared/domain/AggregateRoot";
import { UniqueEntityID } from "../../../../shared/domain/UniqueEntityID";
import { Result, ok, err } from "../../../../shared/core/Result";
import { Guard, IGuardArgument } from "../../../../shared/core/Guard";
import {
  AnnotationTemplateId,
  AnnotationTemplateName,
  AnnotationTemplateDescription,
  CuratorId,
  PublishedRecordId,
  AnnotationTemplateFields,
  AnnotationFieldId,
} from "../value-objects";
import { AnnotationField } from ".";

export interface AnnotationTemplateProps {
  curatorId: CuratorId;
  name: AnnotationTemplateName;
  description: AnnotationTemplateDescription;
  annotationTemplateFields: AnnotationTemplateFields;
  createdAt?: Date;
  publishedRecordId?: PublishedRecordId;
}

export class AnnotationTemplate extends AggregateRoot<AnnotationTemplateProps> {
  get templateId(): AnnotationTemplateId {
    return AnnotationTemplateId.create(this._id).unwrap();
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

  get annotationTemplateFields(): AnnotationTemplateFields {
    return this.props.annotationTemplateFields;
  }
  get createdAt(): Date {
    // Guaranteed by the create method's default
    return this.props.createdAt!;
  }

  get publishedRecordId(): PublishedRecordId | undefined {
    return this.props.publishedRecordId;
  }

  public getAnnotationFields(): AnnotationField[] {
    return this.props.annotationTemplateFields.getAnnotationFields();
  }

  public getAnnotationFieldById(
    annotationFieldId: AnnotationFieldId
  ): Result<AnnotationField> {
    return this.props.annotationTemplateFields.getAnnotationFieldById(
      annotationFieldId
    );
  }

  public getRequiredFields(): AnnotationField[] {
    return this.props.annotationTemplateFields.annotationTemplateFields
      .filter((field) => field.isRequired())
      .map((field) => field.annotationField);
  }
  public markAsPublished(publishedRecordId: PublishedRecordId): void {
    this.props.publishedRecordId = publishedRecordId;
  }

  public hasUnpublishedFields(): boolean {
    return this.props.annotationTemplateFields
      .getAnnotationFields()
      .some((field) => !field.isPublished());
  }

  public markAnnotationTemplateFieldAsPublished(
    annotationFieldId: AnnotationFieldId,
    publishedRecordId: PublishedRecordId
  ): Result<void> {
    const fieldResult =
      this.props.annotationTemplateFields.getAnnotationFieldById(
        annotationFieldId
      );
    if (fieldResult.isErr()) {
      return err(fieldResult.error);
    }

    fieldResult.value.markAsPublished(publishedRecordId);
    return ok(undefined);
  }

  private constructor(props: AnnotationTemplateProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: AnnotationTemplateProps, // Use the new create props type
    id?: UniqueEntityID
  ): Result<AnnotationTemplate> {
    const guardArgs: IGuardArgument[] = [
      { argument: props.curatorId, argumentName: "curatorId" },
      { argument: props.name, argumentName: "name" },
      { argument: props.description, argumentName: "description" },
      {
        argument: props.annotationTemplateFields,
        argumentName: "annotationTemplateFields",
      },
    ];

    const guardResult = Guard.againstNullOrUndefinedBulk(guardArgs);
    if (guardResult.isErr()) {
      return err(new Error(guardResult.error));
    }

    if (props.annotationTemplateFields.isEmpty()) {
      return err(
        new Error("Annotation template must have at least one field.")
      );
    }

    if (!props.createdAt) {
      props.createdAt = new Date();
    }

    const annotationTemplate = new AnnotationTemplate(props, id);

    return ok(annotationTemplate);
  }
}
