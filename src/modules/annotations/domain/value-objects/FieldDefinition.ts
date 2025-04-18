// Base interface or type for all field definitions

export class DyadFieldDef {
  readonly $type = 'app.annos.annotationField#dyadFieldDef'
  readonly sideA: string
  readonly sideB: string

  constructor(sideA: string, sideB: string) {
    if (!sideA || !sideB) {
      throw new Error('Dyad field labels cannot be empty.')
    }
    this.sideA = sideA
    this.sideB = sideB
  }
}

export class TriadFieldDef {
  readonly $type = 'app.annos.annotationField#triadFieldDef'
  readonly vertexA: string
  readonly vertexB: string
  readonly vertexC: string

  constructor(vertexA: string, vertexB: string, vertexC: string) {
    if (!vertexA || !vertexB || !vertexC) {
      throw new Error('Triad field labels cannot be empty.')
    }
    this.vertexA = vertexA
    this.vertexB = vertexB
    this.vertexC = vertexC
  }
}

export class RatingFieldDef {
  readonly $type = 'app.annos.annotationField#ratingFieldDef'
  readonly numberOfStars: 5 = 5 // Currently fixed by lexicon

  constructor() {
    // No arguments needed as numberOfStars is const 5
  }
}

export class SingleSelectFieldDef {
  readonly $type = 'app.annos.annotationField#singleSelectFieldDef'
  readonly options: string[]

  constructor(options: string[]) {
    if (!options || options.length === 0) {
      throw new Error('SingleSelect field must have options.')
    }
    if (options.some((opt) => !opt || opt.trim().length === 0)) {
      throw new Error('SingleSelect options cannot be empty.')
    }
    // Ensure unique options
    this.options = [...new Set(options)]
  }
}

export class MultiSelectFieldDef {
  readonly $type = 'app.annos.annotationField#multiSelectFieldDef'
  readonly options: string[]

  constructor(options: string[]) {
    if (!options || options.length === 0) {
      throw new Error('MultiSelect field must have options.')
    }
    if (options.some((opt) => !opt || opt.trim().length === 0)) {
      throw new Error('MultiSelect options cannot be empty.')
    }
    // Ensure unique options
    this.options = [...new Set(options)]
  }
}

// Union type
export type FieldDefinition =
  | DyadFieldDef
  | TriadFieldDef
  | RatingFieldDef
  | SingleSelectFieldDef
  | MultiSelectFieldDef
