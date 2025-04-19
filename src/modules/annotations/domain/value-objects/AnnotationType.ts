import { ValueObject } from "../../../../shared/domain/ValueObject";

interface AnnotationTypeProps {
  value: string;
}

const DYAD_VALUE_TYPE = "dyad";
const TRIAD_VALUE_TYPE = "triad";
const RATING_VALUE_TYPE = "rating";
const SINGLE_SELECT_VALUE_TYPE = "singleSelect";
const MULTI_SELECT_VALUE_TYPE = "multiSelect";

const VALID_TYPES = new Set([
  DYAD_VALUE_TYPE,
  TRIAD_VALUE_TYPE,
  RATING_VALUE_TYPE,
  SINGLE_SELECT_VALUE_TYPE,
  MULTI_SELECT_VALUE_TYPE,
]);

export class AnnotationType extends ValueObject<AnnotationTypeProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: AnnotationTypeProps) {
    super(props);
  }

  public static create(type: string): AnnotationType {
    if (!VALID_TYPES.has(type)) {
      // Or return a Result<AnnotationType> for better error handling
      throw new Error(`Invalid AnnotationType: ${type}`);
    }
    return new AnnotationType({ value: type });
  }

  public static readonly DYAD = new AnnotationType({ value: DYAD_VALUE_TYPE });
  public static readonly TRIAD = new AnnotationType({
    value: TRIAD_VALUE_TYPE,
  });
  public static readonly RATING = new AnnotationType({
    value: RATING_VALUE_TYPE,
  });
  public static readonly SINGLE_SELECT = new AnnotationType({
    value: SINGLE_SELECT_VALUE_TYPE,
  });
  public static readonly MULTI_SELECT = new AnnotationType({
    value: MULTI_SELECT_VALUE_TYPE,
  });
}
