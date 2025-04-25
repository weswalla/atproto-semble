import { ValueObject } from "../../../../shared/domain/ValueObject";
import { AnnotationType } from "./AnnotationType";
import { err, ok, Result } from "../../../../shared/core/Result";

export interface IDyadFieldDefProps {
  sideA: string;
  sideB: string;
}
export interface ITriadFieldDefProps {
  vertexA: string;
  vertexB: string;
  vertexC: string;
}
export interface IRatingFieldDefProps {
  numberOfStars: 5;
}
export interface ISelectFieldDefProps {
  options: string[];
}

export type AnnotationFieldDefProps =
  | IDyadFieldDefProps
  | ITriadFieldDefProps
  | IRatingFieldDefProps
  | ISelectFieldDefProps;

function getAnnotationFieldType(
  props: AnnotationFieldDefProps
): Result<AnnotationType> {
  if ("sideA" in props && "sideB" in props) {
    return ok(AnnotationType.DYAD);
  }
  if ("vertexA" in props && "vertexB" in props && "vertexC" in props) {
    return ok(AnnotationType.TRIAD);
  }
  if ("numberOfStars" in props && props.numberOfStars === 5) {
    return ok(AnnotationType.RATING);
  }
  if ("options" in props && Array.isArray(props.options)) {
    return ok(AnnotationType.SINGLE_SELECT);
  }
  return err(Error("invalid annotation field def props"));
}

export abstract class AnnotationFieldDefinitionBase<
  T extends object,
> extends ValueObject<T> {
  abstract readonly type: AnnotationType;

  public isSameType(other?: AnnotationFieldDefinitionBase<any>): boolean {
    return !!other && this.type.equals(other.type);
  }
}

export class DyadFieldDef extends AnnotationFieldDefinitionBase<IDyadFieldDefProps> {
  readonly type = AnnotationType.DYAD;

  get sideA(): string {
    return this.props.sideA;
  }
  get sideB(): string {
    return this.props.sideB;
  }

  private constructor(props: IDyadFieldDefProps) {
    super(props);
  }

  public static create(props: IDyadFieldDefProps): Result<DyadFieldDef> {
    const propsTypeResult = getAnnotationFieldType(props);
    if (
      propsTypeResult.isErr() ||
      !propsTypeResult.value.equals(AnnotationType.DYAD)
    ) {
      return err(new Error('Invalid DyadFieldDef props'));
    }
    if (!props.sideA?.trim() || !props.sideB?.trim()) {
      return err(new Error('Dyad field labels cannot be empty.')); // Use err
    }
    return ok(
      new DyadFieldDef({ sideA: props.sideA.trim(), sideB: props.sideB.trim() }),
    );
  }
}

export class TriadFieldDef extends AnnotationFieldDefinitionBase<ITriadFieldDefProps> {
  readonly type = AnnotationType.TRIAD;

  get vertexA(): string {
    return this.props.vertexA;
  }
  get vertexB(): string {
    return this.props.vertexB;
  }
  get vertexC(): string {
    return this.props.vertexC;
  }

  private constructor(props: ITriadFieldDefProps) {
    super(props);
  }

  public static create(props: ITriadFieldDefProps): Result<TriadFieldDef> {
    const propsTypeResult = getAnnotationFieldType(props);
    if (
      propsTypeResult.isErr() ||
      !propsTypeResult.value.equals(AnnotationType.TRIAD)
    ) {
      return err(new Error("Invalid TriadFieldDef props"));
    }
    if (
      !props.vertexA?.trim() ||
      !props.vertexB?.trim() ||
      !props.vertexC?.trim()
    ) {
      return err(new Error('Triad field labels cannot be empty.')); // Use err
    }
    return ok(
      new TriadFieldDef({
        vertexA: props.vertexA.trim(),
        vertexB: props.vertexB.trim(),
        vertexC: props.vertexC.trim(),
      })
    );
  }
}

export class RatingFieldDef extends AnnotationFieldDefinitionBase<IRatingFieldDefProps> {
  readonly type = AnnotationType.RATING;
  readonly numberOfStars: 5 = 5;

  private constructor(props: IRatingFieldDefProps) {
    super(props);
  }

  public static create(): Result<RatingFieldDef> {
    return ok(new RatingFieldDef({ numberOfStars: 5 }));
  }
}

// Helper for select options validation
function validateSelectOptions(options: string[]): Result<string[]> {
  if (!options || options.length === 0) {
    return err(new Error('Selected field must have options.')); // Use err
  }
  const trimmedOptions = options
    .map((opt) => opt?.trim())
    .filter((opt) => !!opt);
  if (trimmedOptions.length !== options.length) {
    return err(new Error('Selected options cannot be empty or just whitespace.')); // Use err
  }
  // Ensure unique options and sort for consistent comparison via props
  const uniqueSortedOptions = [...new Set(trimmedOptions)].sort();
  return ok(uniqueSortedOptions);
}

export class SingleSelectFieldDef extends AnnotationFieldDefinitionBase<ISelectFieldDefProps> {
  readonly type = AnnotationType.SINGLE_SELECT;

  get options(): string[] {
    return [...this.props.options];
  } // Return copy

  private constructor(props: ISelectFieldDefProps) {
    super(props);
  }

  public static create(
    props: ISelectFieldDefProps
  ): Result<SingleSelectFieldDef> {
    const propsTypeResult = getAnnotationFieldType(props);
    if (
      propsTypeResult.isErr() ||
      !propsTypeResult.value.equals(AnnotationType.SINGLE_SELECT)
    ) {
      return err(new Error("Invalid SingleSelectFieldDef props"));
    }
    const optionsResult = validateSelectOptions(props.options);
    if (optionsResult.isErr()) {
      return err(optionsResult.error); // Propagate error
    }
    return ok(new SingleSelectFieldDef({ options: optionsResult.value }));
  }
}

export class MultiSelectFieldDef extends AnnotationFieldDefinitionBase<ISelectFieldDefProps> {
  readonly type = AnnotationType.MULTI_SELECT;

  get options(): string[] {
    return [...this.props.options];
  } // Return copy

  private constructor(props: ISelectFieldDefProps) {
    super(props);
  }

  public static create(
    props: ISelectFieldDefProps
  ): Result<MultiSelectFieldDef> {
    const propsTypeResult = getAnnotationFieldType(props);
    if (
      propsTypeResult.isErr() ||
      !propsTypeResult.value.equals(AnnotationType.SINGLE_SELECT)
    ) {
      return err(new Error("Invalid MultiSelectFieldDef props"));
    }
    const optionsResult = validateSelectOptions(props.options);
    if (optionsResult.isErr()) {
      return err(optionsResult.error); // Propagate error
    }

    return ok(new MultiSelectFieldDef({ options: optionsResult.value }));
  }
}

export type AnnotationFieldDefinition = AnnotationFieldDefinitionBase<object>;
