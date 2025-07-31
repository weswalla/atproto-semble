import { ValueObject } from '../../../../shared/domain/ValueObject';
import { Result, ok, err } from '../../../../shared/core/Result';

export enum ActivityTypeEnum {
  CARD_ADDED_TO_LIBRARY = 'CARD_ADDED_TO_LIBRARY',
  CARD_ADDED_TO_COLLECTION = 'CARD_ADDED_TO_COLLECTION',
}

interface ActivityTypeProps {
  value: ActivityTypeEnum;
}

export class ActivityType extends ValueObject<ActivityTypeProps> {
  get value(): ActivityTypeEnum {
    return this.props.value;
  }

  private constructor(props: ActivityTypeProps) {
    super(props);
  }

  public static create(type: ActivityTypeEnum): Result<ActivityType> {
    if (!Object.values(ActivityTypeEnum).includes(type)) {
      return err(new Error(`Invalid activity type: ${type}`));
    }
    return ok(new ActivityType({ value: type }));
  }

  public static cardAddedToLibrary(): Result<ActivityType> {
    return this.create(ActivityTypeEnum.CARD_ADDED_TO_LIBRARY);
  }

  public static cardAddedToCollection(): Result<ActivityType> {
    return this.create(ActivityTypeEnum.CARD_ADDED_TO_COLLECTION);
  }
}
