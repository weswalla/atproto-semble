import { ValueObject } from "../../../../../shared/domain/ValueObject";
import { Result } from "../../../../../shared/core/Result";

export enum CardTypeEnum {
  URL = 'URL',
  NOTE = 'NOTE',
  HIGHLIGHT = 'HIGHLIGHT',
  SCREENSHOT = 'SCREENSHOT',
  FILE = 'FILE'
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
    return Result.ok<CardType>(new CardType({ value: type }));
  }
}
