// Base interface or type for all annotation values
// Using specific classes for each type allows for type checking and specific logic

export class DyadValue {
  readonly $type = "app.annos.annotation#dyadValue";
  readonly value: number; // 0-100

  constructor(value: number) {
    if (value < 0 || value > 100) {
      throw new Error("Dyad value must be between 0 and 100.");
    }
    this.value = value;
  }
}

export class TriadValue {
  readonly $type = "app.annos.annotation#triadValue";
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
}

export class RatingValue {
  readonly $type = "app.annos.annotation#ratingValue";
  readonly rating: number; // 1-10 (or based on field definition?) Lexicon says 1-10

  constructor(rating: number) {
    // TODO: Potentially link validation to RatingFieldDef.numberOfStars?
    // Lexicon currently defines 1-10 range directly on value.
    if (rating < 1 || rating > 10) {
      throw new Error("Rating value must be between 1 and 10.");
    }
    this.rating = rating;
  }
}

export class SingleSelectValue {
  readonly $type = "app.annos.annotation#singleSelectValue";
  readonly option: string;

  constructor(option: string) {
    // TODO: Validation against options in SingleSelectFieldDef might happen
    // at the Aggregate (Annotation) or Application Service level.
    if (!option || option.trim().length === 0) {
      throw new Error("SingleSelect option cannot be empty.");
    }
    this.option = option;
  }
}

export class MultiSelectValue {
  readonly $type = "app.annos.annotation#multiSelectValue";
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
    // Ensure unique options
    this.options = [...new Set(options)];
  }
}

// Union type
export type AnnotationValue =
  | DyadValue
  | TriadValue
  | RatingValue
  | SingleSelectValue
  | MultiSelectValue;
