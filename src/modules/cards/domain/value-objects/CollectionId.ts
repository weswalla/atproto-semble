import { ok, Result, err } from "src/shared/core/Result";
import { Guard } from "src/shared/core/Guard";
import { UniqueEntityID } from "src/shared/domain/UniqueEntityID";
import { ValueObject } from "src/shared/domain/ValueObject";

interface CollectionIdProps {
  value: UniqueEntityID;
}

export class CollectionId extends ValueObject<CollectionIdProps> {
  getStringValue(): string {
    return this.props.value.toString();
  }

  getValue(): UniqueEntityID {
    return this.props.value;
  }

  private constructor(value: UniqueEntityID) {
    super({ value });
  }

  public static create(id: UniqueEntityID): Result<CollectionId> {
    const guardResult = Guard.againstNullOrUndefined(id, "id");
    if (guardResult.isErr()) {
      return err(new Error(guardResult.error));
    }
    return ok(new CollectionId(id));
  }

  public static createFromString(value: string): Result<CollectionId> {
    const guardResult = Guard.againstNullOrUndefined(value, "value");
    if (guardResult.isErr()) {
      return err(new Error(guardResult.error));
    }
    const uniqueEntityID = new UniqueEntityID(value);
    return ok(new CollectionId(uniqueEntityID));
  }
}
