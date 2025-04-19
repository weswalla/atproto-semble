import { ValueObject } from "../../../../shared/domain/ValueObject";
import { AnnotationType } from "./AnnotationType";
import { Result } from "../../../../shared/core/Result";

// Define interfaces for the props of each definition type
interface IDyadFieldDefProps { sideA: string; sideB: string; }
interface ITriadFieldDefProps { vertexA: string; vertexB: string; vertexC: string; }
interface IRatingFieldDefProps { numberOfStars: 5; } // Fixed by lexicon
interface ISelectFieldDefProps { options: string[]; } // Used by Single and Multi

// Abstract base class for all annotation field definitions
export abstract class AnnotationFieldDefinitionBase<T extends object> extends ValueObject<T> {
  abstract readonly type: AnnotationType;

  public isSameType(other?: AnnotationFieldDefinitionBase<any>): boolean {
    return !!other && this.type.equals(other.type);
  }
}

// Concrete definition classes

export class DyadFieldDef extends AnnotationFieldDefinitionBase<IDyadFieldDefProps> {
  readonly type = AnnotationType.DYAD;

  get sideA(): string { return this.props.sideA; }
  get sideB(): string { return this.props.sideB; }

  private constructor(props: IDyadFieldDefProps) {
    super(props);
  }

  public static create(sideA: string, sideB: string): Result<DyadFieldDef> {
    if (!sideA?.trim() || !sideB?.trim()) {
      return Result.fail<DyadFieldDef>('Dyad field labels cannot be empty.');
    }
    return Result.ok<DyadFieldDef>(new DyadFieldDef({ sideA: sideA.trim(), sideB: sideB.trim() }));
  }
}

export class TriadFieldDef extends AnnotationFieldDefinitionBase<ITriadFieldDefProps> {
  readonly type = AnnotationType.TRIAD;

  get vertexA(): string { return this.props.vertexA; }
  get vertexB(): string { return this.props.vertexB; }
  get vertexC(): string { return this.props.vertexC; }

  private constructor(props: ITriadFieldDefProps) {
    super(props);
  }

  public static create(vertexA: string, vertexB: string, vertexC: string): Result<TriadFieldDef> {
    if (!vertexA?.trim() || !vertexB?.trim() || !vertexC?.trim()) {
      return Result.fail<TriadFieldDef>('Triad field labels cannot be empty.');
    }
    return Result.ok<TriadFieldDef>(new TriadFieldDef({
      vertexA: vertexA.trim(),
      vertexB: vertexB.trim(),
      vertexC: vertexC.trim()
    }));
  }
}

export class RatingFieldDef extends AnnotationFieldDefinitionBase<IRatingFieldDefProps> {
  readonly type = AnnotationType.RATING;
  readonly numberOfStars: 5 = 5; // Fixed by lexicon

  private constructor(props: IRatingFieldDefProps) {
    super(props);
  }

  // Since numberOfStars is fixed, create doesn't need arguments
  public static create(): Result<RatingFieldDef> {
    return Result.ok<RatingFieldDef>(new RatingFieldDef({ numberOfStars: 5 }));
  }
}

// Helper for select options validation
function validateSelectOptions(options: string[]): Result<string[]> {
  if (!options || options.length === 0) {
    return Result.fail<string[]>('Select field must have options.');
  }
  const trimmedOptions = options.map(opt => opt?.trim()).filter(opt => !!opt);
  if (trimmedOptions.length !== options.length) {
    return Result.fail<string[]>('Select options cannot be empty or just whitespace.');
  }
  // Ensure unique options and sort for consistent comparison via props
  const uniqueSortedOptions = [...new Set(trimmedOptions)].sort();
  return Result.ok<string[]>(uniqueSortedOptions);
}

export class SingleSelectFieldDef extends AnnotationFieldDefinitionBase<ISelectFieldDefProps> {
  readonly type = AnnotationType.SINGLE_SELECT;

  get options(): string[] { return [...this.props.options]; } // Return copy

  private constructor(props: ISelectFieldDefProps) {
    super(props);
  }

  public static create(options: string[]): Result<SingleSelectFieldDef> {
    const optionsResult = validateSelectOptions(options);
    if (optionsResult.isFailure) {
      return Result.fail<SingleSelectFieldDef>(optionsResult.getErrorValue());
    }
    return Result.ok<SingleSelectFieldDef>(new SingleSelectFieldDef({ options: optionsResult.getValue() }));
  }
}

export class MultiSelectFieldDef extends AnnotationFieldDefinitionBase<ISelectFieldDefProps> {
  readonly type = AnnotationType.MULTI_SELECT;

  get options(): string[] { return [...this.props.options]; } // Return copy

  private constructor(props: ISelectFieldDefProps) {
    super(props);
  }

  public static create(options: string[]): Result<MultiSelectFieldDef> {
     const optionsResult = validateSelectOptions(options);
     if (optionsResult.isFailure) {
       return Result.fail<MultiSelectFieldDef>(optionsResult.getErrorValue());
     }
     return Result.ok<MultiSelectFieldDef>(new MultiSelectFieldDef({ options: optionsResult.getValue() }));
  }
}

// Union type
export type AnnotationFieldDefinition = AnnotationFieldDefinitionBase<object>;
