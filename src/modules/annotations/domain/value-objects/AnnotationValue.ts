import { ValueObject } from "../../../../shared/domain/ValueObject";
import { AnnotationField } from "../aggregates";
import { AnnotationFieldDefinition } from "./AnnotationFieldDefinition";
import { AnnotationType } from "./AnnotationType";

interface IDyadValueProps {
  value: number;
}
interface ITriadValueProps {
  vertexA: number;
  vertexB: number;
  vertexC: number;
}
interface IRatingValueProps {
  rating: number;
}
interface ISingleSelectValueProps {
  option: string;
}
interface IMultiSelectValueProps {
  options: string[];
}

// Abstract base class for all annotation values, extending the shared ValueObject
export abstract class AnnotationValueBase<
  T extends object,
> extends ValueObject<T> {
  abstract readonly type: AnnotationType;

  /**
   * Checks if the other AnnotationValue is of the same type.
   * Checks if the other AnnotationValue is of the same specific type.
   * @param other The other AnnotationValue to compare against.
   * @returns True if the types match, false otherwise.
   */
  public isSameType(other?: AnnotationValueBase<any>): boolean {
    return !!other && this.type.equals(other.type);
  }

  public typeMatchesDefinition(definition: AnnotationFieldDefinition): boolean {
    return this.type.equals(definition.type);
  }

  public matchesFieldType(field: AnnotationField): boolean {
    return this.type.equals(field.definition.type);
  }
}

// Using specific classes for each type allows for type checking and specific logic

export class DyadValue extends AnnotationValueBase<IDyadValueProps> {
  readonly type = AnnotationType.DYAD;

  get value(): number {
    return this.props.value;
  }

  private constructor(props: IDyadValueProps) {
    super(props);
  }

  public static create(props: IDyadValueProps): DyadValue {
    if (props.value < 0 || props.value > 100) {
      throw new Error("Dyad value must be between 0 and 100.");
    }
    return new DyadValue({ value: props.value });
  }
}

export class TriadValue extends AnnotationValueBase<ITriadValueProps> {
  readonly type = AnnotationType.TRIAD;

  get vertexA(): number {
    return this.props.vertexA;
  }
  get vertexB(): number {
    return this.props.vertexB;
  }
  get vertexC(): number {
    return this.props.vertexC;
  }

  private constructor(props: ITriadValueProps) {
    super(props);
  }

  public static create(props: ITriadValueProps): TriadValue {
    if (
      [props.vertexA, props.vertexB, props.vertexC].some(
        (v) => v < 0 || v > 1000
      )
    ) {
      throw new Error("Triad vertex values must be between 0 and 1000.");
    }
    if (props.vertexA + props.vertexB + props.vertexC !== 1000) {
      throw new Error("Triad vertex values must sum to 1000.");
    }
    return new TriadValue(props);
  }
}

export class RatingValue extends AnnotationValueBase<IRatingValueProps> {
  readonly type = AnnotationType.RATING;

  get rating(): number {
    return this.props.rating;
  }

  private constructor(props: IRatingValueProps) {
    super(props);
  }

  public static create(props: IRatingValueProps): RatingValue {
    // TODO: Potentially link validation to RatingFieldDef.numberOfStars?
    // Lexicon currently defines 1-10 range directly on value.
    if (props.rating < 1 || props.rating > 10) {
      throw new Error("Rating value must be between 1 and 10.");
    }
    return new RatingValue({ rating: props.rating });
  }
}

export class SingleSelectValue extends AnnotationValueBase<ISingleSelectValueProps> {
  readonly type = AnnotationType.SINGLE_SELECT;

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
}

export class MultiSelectValue extends AnnotationValueBase<IMultiSelectValueProps> {
  readonly type = AnnotationType.MULTI_SELECT;

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
}

export type AnnotationValue = AnnotationValueBase<object>;
