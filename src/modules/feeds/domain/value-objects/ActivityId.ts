import { ValueObject } from '../../../../shared/domain/ValueObject';
import { UniqueEntityID } from '../../../../shared/domain/UniqueEntityID';
import { Result, ok, err } from '../../../../shared/core/Result';

interface ActivityIdProps {
  value: UniqueEntityID;
}

export class ActivityId extends ValueObject<ActivityIdProps> {
  getStringValue(): string {
    return this.props.value.toString();
  }

  getValue(): UniqueEntityID {
    return this.props.value;
  }

  private constructor(value: UniqueEntityID) {
    super({ value });
  }

  public static create(id?: UniqueEntityID): Result<ActivityId> {
    return ok(new ActivityId(id || new UniqueEntityID()));
  }

  public static createFromString(id: string): Result<ActivityId> {
    if (!id || id.trim().length === 0) {
      return err(new Error('Activity ID cannot be empty'));
    }
    return ok(new ActivityId(new UniqueEntityID(id)));
  }
}
