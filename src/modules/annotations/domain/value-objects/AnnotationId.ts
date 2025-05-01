import { Guard } from "src/shared/core/Guard";
import { err, ok, Result } from "src/shared/core/Result";
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
    if (guardResult.isErr()) {
      return err(new Error(guardResult.error));
    }
    return ok(new AnnotationId(value));
  }
  public static createFromString(value: string): Result<AnnotationId> {
    const guardResult = Guard.againstNullOrUndefined(value, "value");
    if (guardResult.isErr()) {
      return err(new Error(guardResult.error));
    }
    const uniqueEntityID = new UniqueEntityID(value);
    return ok(new AnnotationId(uniqueEntityID));
  }
}
