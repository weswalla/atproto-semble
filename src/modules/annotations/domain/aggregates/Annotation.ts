import { AnnotationValue } from "../value-objects/AnnotationValue";
import { URI } from "../value-objects/URI";
import { AggregateRoot } from "src/shared/domain/AggregateRoot";
import { err, ok, Result } from "src/shared/core/Result";
import { UpdateAnnotationErrors } from "../../application/use-cases/errors";
import { UniqueEntityID } from "src/shared/domain/UniqueEntityID";
import { Guard, IGuardArgument } from "src/shared/core/Guard";
import {
  AnnotationFieldId,
  AnnotationId,
  AnnotationNote,
  AnnotationTemplateId,
  CuratorId,
  PublishedRecordId,
} from "../value-objects";

export interface AnnotationProps {
  curatorId: CuratorId;
  url: URI;
  annotationFieldId: AnnotationFieldId;
  value: AnnotationValue;
  annotationTemplateIds?: AnnotationTemplateId[];
  note?: AnnotationNote;
  createdAt?: Date;
  publishedRecordId?: PublishedRecordId;
}

export class Annotation extends AggregateRoot<AnnotationProps> {
  get annotationId(): AnnotationId {
    return AnnotationId.create(this._id).unwrap();
  }
  get curatorId(): CuratorId {
    return this.props.curatorId;
  }
  get url(): URI {
    return this.props.url;
  }
  get annotationFieldId(): AnnotationFieldId {
    return this.props.annotationFieldId;
  }
  get value(): AnnotationValue {
    return this.props.value;
  }
  get annotationTemplateIds(): AnnotationTemplateId[] | undefined {
    return this.props.annotationTemplateIds;
  }
  get note(): AnnotationNote | undefined {
    return this.props.note;
  }
  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }
  get publishedRecordId(): PublishedRecordId | undefined {
    return this.props.publishedRecordId;
  }

  public updatePublishedRecordId(publishedRecordId: PublishedRecordId): void {
    this.props.publishedRecordId = publishedRecordId;
  }

  public updateValue(
    value: AnnotationValue
  ): Result<void, UpdateAnnotationErrors.InvalidValueTypeError> {
    if (!this.value.isSameType(value)) {
      return err(new UpdateAnnotationErrors.InvalidValueTypeError());
    }
    this.props.value = value;
    return ok(undefined);
  }

  private constructor(props: AnnotationProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: AnnotationProps,
    id?: UniqueEntityID
  ): Result<Annotation, string> {
    const guardArgs: IGuardArgument[] = [
      { argument: props.curatorId, argumentName: "curatorId" },
      { argument: props.url, argumentName: "url" },
      { argument: props.annotationFieldId, argumentName: "annotationFieldId" },
      { argument: props.value, argumentName: "value" },
    ];

    const guardResult = Guard.againstNullOrUndefinedBulk(guardArgs);

    if (guardResult.isErr()) {
      return err(guardResult.error);
    }

    const defaultValues: AnnotationProps = {
      ...props,
      annotationTemplateIds: props.annotationTemplateIds || [],
      note: props.note,
      createdAt: props.createdAt || new Date(),
      publishedRecordId: props.publishedRecordId,
    };

    const annotation = new Annotation(defaultValues, id);

    return ok(annotation);
  }
}
