import { Guard } from "src/shared/core/Guard";
import { Result } from "src/shared/core/Result";
import { UniqueEntityID } from "src/shared/domain/UniqueEntityID";
import { ValueObject } from "src/shared/domain/ValueObject";

export class AnnotationId extends ValueObject<{
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

  public static create(value: UniqueEntityID): Result<AnnotationId> {
    let guardResult = Guard.againstNullOrUndefined(value, "value");
    if (guardResult.isFailure) {
      return Result.fail<AnnotationId>(guardResult.getErrorValue());
    }
    return Result.ok<AnnotationId>(new AnnotationId(value));
  }
}
