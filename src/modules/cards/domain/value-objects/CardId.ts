import { ValueObject } from "../../../../../shared/domain/ValueObject";
import { UniqueEntityID } from "../../../../../shared/domain/UniqueEntityID";
import { Result } from "../../../../../shared/core/Result";

interface CardIdProps {
  value: UniqueEntityID;
}

export class CardId extends ValueObject<CardIdProps> {
  getStringValue(): string {
    return this.props.value.toString();
  }

  getValue(): UniqueEntityID {
    return this.props.value;
  }

  private constructor(value: UniqueEntityID) {
    super({ value });
  }

  public static create(id: UniqueEntityID): Result<CardId> {
    return Result.ok<CardId>(new CardId(id));
  }
}
