import { ValueObject } from "../../../../shared/domain/ValueObject";

// Define interfaces for the props of each value object type
interface IDyadValueProps { value: number; }
interface ITriadValueProps { vertexA: number; vertexB: number; vertexC: number; }
interface IRatingValueProps { rating: number; }
interface ISingleSelectValueProps { option: string; }
interface IMultiSelectValueProps { options: string[]; }

// Abstract base class for all annotation values, extending the shared ValueObject
export abstract class AnnotationValueBase<T extends object> extends ValueObject<T> {
  abstract readonly $type: string;

  /**
   * Checks if the other AnnotationValue is of the same type and has the same value.
   * Checks if the other AnnotationValue is of the same specific type.
   * @param other The other AnnotationValue to compare against.
   * @returns True if the types match, false otherwise.
   */
  public isSameType(other?: AnnotationValueBase): boolean {
    return !!other && this.$type === other.$type;
  }
}

// Using specific classes for each type allows for type checking and specific logic

export class DyadValue extends AnnotationValueBase<IDyadValueProps> {
  readonly $type = "app.annos.annotation#dyadValue";

  get value(): number {
    return this.props.value;
  }

  private constructor(props: IDyadValueProps) {
    super(props);
  }

  public static create(value: number): DyadValue {
    if (value < 0 || value > 100) {
      throw new Error("Dyad value must be between 0 and 100.");
    }
    return new DyadValue({ value });
  }

  // Base ValueObject.equals should suffice as it compares props
}

export class TriadValue extends AnnotationValueBase<ITriadValueProps> {
  readonly $type = "app.annos.annotation#triadValue";

  get vertexA(): number { return this.props.vertexA; }
  get vertexB(): number { return this.props.vertexB; }
  get vertexC(): number { return this.props.vertexC; }
  // sum is an invariant checked at creation, not stored state

  private constructor(props: ITriadValueProps) {
    super(props);
  }

  public static create(vertexA: number, vertexB: number, vertexC: number): TriadValue {
    if ([vertexA, vertexB, vertexC].some((v) => v < 0 || v > 1000)) {
      throw new Error("Triad vertex values must be between 0 and 1000.");
    }
    if (vertexA + vertexB + vertexC !== 1000) {
      throw new Error("Triad vertex values must sum to 1000.");
    }
    return new TriadValue({ vertexA, vertexB, vertexC });
  }

  // Base ValueObject.equals should suffice
}

export class RatingValue extends AnnotationValueBase<IRatingValueProps> {
  readonly $type = "app.annos.annotation#ratingValue";

  get rating(): number {
    return this.props.rating;
  }

  private constructor(props: IRatingValueProps) {
    super(props);
  }

  public static create(rating: number): RatingValue {
    // TODO: Potentially link validation to RatingFieldDef.numberOfStars?
    // Lexicon currently defines 1-10 range directly on value.
    if (rating < 1 || rating > 10) {
      throw new Error("Rating value must be between 1 and 10.");
    }
    return new RatingValue({ rating });
  }

  // Base ValueObject.equals should suffice
}

export class SingleSelectValue extends AnnotationValueBase<ISingleSelectValueProps> {
  readonly $type = "app.annos.annotation#singleSelectValue";

  get option(): string {
    return this.props.option;
  }

  private constructor(props: ISingleSelectValueProps) {
    super(props);
  }

  public static create(option: string): SingleSelectValue {
    // TODO: Validation against options in SingleSelectFieldDef might happen
    // at the Aggregate (Annotation) or Application Service level.
    if (!option || option.trim().length === 0) {
      throw new Error("SingleSelect option cannot be empty.");
    }
    return new SingleSelectValue({ option });
  }

  // Base ValueObject.equals should suffice
}

export class MultiSelectValue extends AnnotationValueBase<IMultiSelectValueProps> {
  readonly $type = "app.annos.annotation#multiSelectValue";

  // Return a copy to prevent external modification
  get options(): string[] {
    return [...this.props.options];
  }

  private constructor(props: IMultiSelectValueProps) {
    super(props);
  }

  public static create(options: string[]): MultiSelectValue {
    // TODO: Validation against options in MultiSelectFieldDef might happen
    // at the Aggregate (Annotation) or Application Service level.
    if (!options || options.length === 0) {
      throw new Error("MultiSelect must have at least one option selected.");
    }
    if (options.some((opt) => !opt || opt.trim().length === 0)) {
      throw new Error("MultiSelect options cannot be empty.");
    }
    // Ensure unique options and sort for consistent comparison via props
    const uniqueSortedOptions = [...new Set(options)].sort();
    return new MultiSelectValue({ options: uniqueSortedOptions });
  }

  // Base ValueObject.equals should suffice because options in props are sorted
}

// Union type of all concrete AnnotationValue implementations
export type AnnotationValue =
  | DyadValue
  | TriadValue
  | RatingValue
  | SingleSelectValue
  | MultiSelectValue;
