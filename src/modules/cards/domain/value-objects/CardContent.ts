import { ValueObject } from "src/shared/domain/ValueObject";
import { CardTypeEnum } from "./CardType";
import { ok, Result } from "src/shared/core/Result";

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
    return ok(new CardContent(props));
  }
}
