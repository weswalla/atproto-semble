import { ok, Result } from "src/shared/core/Result";
import { ValueObject } from "src/shared/domain/ValueObject";

export enum CardTypeEnum {
  URL = "URL",
  NOTE = "NOTE",
  HIGHLIGHT = "HIGHLIGHT",
  SCREENSHOT = "SCREENSHOT",
  FILE = "FILE",
}

interface CardTypeProps {
  value: CardTypeEnum;
}

export class CardType extends ValueObject<CardTypeProps> {
  get value(): CardTypeEnum {
    return this.props.value;
  }

  private constructor(props: CardTypeProps) {
    super(props);
  }

  public static create(type: CardTypeEnum): Result<CardType> {
    return ok(new CardType({ value: type }));
  }
}
