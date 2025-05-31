import { ok, Result } from "src/shared/core/Result";
import { UniqueEntityID } from "src/shared/domain/UniqueEntityID";
import { ValueObject } from "src/shared/domain/ValueObject";

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
    return ok(new CardId(id));
  }
}
