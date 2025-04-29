import { ok, Result } from "src/shared/core/Result";
import { UniqueEntityID } from "src/shared/domain/UniqueEntityID";
import { ValueObject } from "src/shared/domain/ValueObject";

export class AnnotationTemplateId extends ValueObject<{
  value: UniqueEntityID;
}> {
  getStringValue(): string {
    return this.props.value.toString();
  }

  getValue(): UniqueEntityID {
    return this.props.value;
  }

  private constructor(value: UniqueEntityID) {
    super({ value });
  }

  public static create(
    value: UniqueEntityID
  ): Result<AnnotationTemplateId, Error> {
    return ok(new AnnotationTemplateId(value));
  }

  public static createFromString(
    value: string
  ): Result<AnnotationTemplateId, Error> {
    const uniqueEntityID = new UniqueEntityID(value);
    return AnnotationTemplateId.create(uniqueEntityID);
  }
}
