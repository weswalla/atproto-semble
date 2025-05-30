import { ValueObject } from "../../../../../shared/domain/ValueObject";
import { UniqueEntityID } from "../../../../../shared/domain/UniqueEntityID";
import { Result } from "../../../../../shared/core/Result";

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
    return Result.ok<CollectionId>(new CollectionId(id));
  }
}
