// Placeholder for Identifier Value Object (app.annos.defs#identifier)
export class Identifier {
  readonly $type = 'app.annos.defs#identifier'
  readonly type: string
  readonly value: string

  constructor(type: string, value: string) {
    if (!type || type.trim().length === 0) {
      throw new Error('Identifier type cannot be empty.')
    }
    if (!value || value.trim().length === 0) {
      throw new Error('Identifier value cannot be empty.')
    }
    // TODO: Add more specific validation based on type? (e.g., regex for DOI, ISBN)
    this.type = type
    this.value = value
  }

  equals(other: Identifier): boolean {
    return this.type === other.type && this.value === other.value
  }
}
