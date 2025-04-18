import { ValueObject } from '../../../../shared/domain/ValueObject'; // Assuming ValueObject is suitable base or for inspiration

// Abstract base class for all annotation values
export abstract class AnnotationValueBase {
  abstract readonly $type: string;

  /**
   * Checks if the other AnnotationValue is of the same type and has the same value.
   * @param other The other AnnotationValue to compare against.
   * @returns True if both type and value are equal, false otherwise.
   */
  abstract equals(other?: AnnotationValueBase): boolean;

  /**
   * Checks if the other AnnotationValue is of the same specific type.
   * @param other The other AnnotationValue to compare against.
   * @returns True if the types match, false otherwise.
   */
  public isSameType(other?: AnnotationValueBase): boolean {
    return !!other && this.$type === other.$type;
  }
}

// Using specific classes for each type allows for type checking and specific logic

export class DyadValue extends AnnotationValueBase {
  readonly $type = 'app.annos.annotation#dyadValue';
  readonly value: number; // 0-100

  constructor(value: number) {
    if (value < 0 || value > 100) {
      throw new Error("Dyad value must be between 0 and 100.");
    }
    this.value = value;
  }

  equals(other?: AnnotationValueBase): boolean {
    if (!this.isSameType(other) || !other) {
      return false;
    }
    // Now we know other is DyadValue due to isSameType check
    return this.value === (other as DyadValue).value;
  }
}

export class TriadValue extends AnnotationValueBase {
  readonly $type = 'app.annos.annotation#triadValue';
  readonly vertexA: number; // 0-1000
  readonly vertexB: number; // 0-1000
  readonly vertexC: number; // 0-1000
  readonly sum: 1000 = 1000;

  constructor(vertexA: number, vertexB: number, vertexC: number) {
    if ([vertexA, vertexB, vertexC].some((v) => v < 0 || v > 1000)) {
      throw new Error("Triad vertex values must be between 0 and 1000.");
    }
    if (vertexA + vertexB + vertexC !== 1000) {
      throw new Error("Triad vertex values must sum to 1000.");
    }
    this.vertexA = vertexA;
    this.vertexB = vertexB;
    this.vertexC = vertexC;
  }

  equals(other?: AnnotationValueBase): boolean {
    if (!this.isSameType(other) || !other) {
      return false;
    }
    const otherTriad = other as TriadValue;
    return (
      this.vertexA === otherTriad.vertexA &&
      this.vertexB === otherTriad.vertexB &&
      this.vertexC === otherTriad.vertexC
    );
  }
}

export class RatingValue extends AnnotationValueBase {
  readonly $type = 'app.annos.annotation#ratingValue';
  readonly rating: number; // 1-10 (or based on field definition?) Lexicon says 1-10

  constructor(rating: number) {
    // TODO: Potentially link validation to RatingFieldDef.numberOfStars?
    // Lexicon currently defines 1-10 range directly on value.
    if (rating < 1 || rating > 10) {
      throw new Error("Rating value must be between 1 and 10.");
    }
    this.rating = rating;
  }

  equals(other?: AnnotationValueBase): boolean {
    if (!this.isSameType(other) || !other) {
      return false;
    }
    return this.rating === (other as RatingValue).rating;
  }
}

export class SingleSelectValue extends AnnotationValueBase {
  readonly $type = 'app.annos.annotation#singleSelectValue';
  readonly option: string;

  constructor(option: string) {
    // TODO: Validation against options in SingleSelectFieldDef might happen
    // at the Aggregate (Annotation) or Application Service level.
    if (!option || option.trim().length === 0) {
      throw new Error("SingleSelect option cannot be empty.");
    }
    this.option = option;
  }

  equals(other?: AnnotationValueBase): boolean {
    if (!this.isSameType(other) || !other) {
      return false;
    }
    return this.option === (other as SingleSelectValue).option;
  }
}

export class MultiSelectValue extends AnnotationValueBase {
  readonly $type = 'app.annos.annotation#multiSelectValue';
  readonly options: string[];

  constructor(options: string[]) {
    // TODO: Validation against options in MultiSelectFieldDef might happen
    // at the Aggregate (Annotation) or Application Service level.
    if (!options || options.length === 0) {
      throw new Error("MultiSelect must have at least one option selected.");
    }
    if (options.some((opt) => !opt || opt.trim().length === 0)) {
      throw new Error("MultiSelect options cannot be empty.");
    }
    // Ensure unique options and sort for consistent comparison
    this.options = [...new Set(options)].sort();
  }

  equals(other?: AnnotationValueBase): boolean {
    if (!this.isSameType(other) || !other) {
      return false;
    }
    const otherMulti = other as MultiSelectValue;
    if (this.options.length !== otherMulti.options.length) {
      return false;
    }
    // Assumes options are sorted in constructor
    for (let i = 0; i < this.options.length; i++) {
      if (this.options[i] !== otherMulti.options[i]) {
        return false;
      }
    }
    return true;
  }
}

// Union type of all concrete AnnotationValue implementations
export type AnnotationValue =
  | DyadValue
  | TriadValue
  | RatingValue
  | SingleSelectValue
  | MultiSelectValue;
