import { ValueObject } from "../../../../../shared/domain/ValueObject";
import { Result } from "../../../../../shared/core/Result";
import { CardTypeEnum } from "./CardType";

interface CardContentProps {
  type: CardTypeEnum;
  data: any; // This would be more strongly typed in a real implementation
}

export class CardContent extends ValueObject<CardContentProps> {
  get type(): CardTypeEnum {
    return this.props.type;
  }

  get data(): any {
    return this.props.data;
  }

  private constructor(props: CardContentProps) {
    super(props);
  }

  public static create(props: CardContentProps): Result<CardContent> {
    // Add validation based on type
    return Result.ok<CardContent>(new CardContent(props));
  }
}
