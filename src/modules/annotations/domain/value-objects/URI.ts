// Placeholder for URI Value Object
export class URI {
  readonly value: string;

  constructor(value: string) {
    // Basic URI validation (can be enhanced)
    try {
      new URL(value); // Check if it parses as a URL
      this.value = value;
    } catch (e) {
      // Handle AT-URI specifically if needed, otherwise throw generic error
      if (value.startsWith("at://")) {
        // Basic AT-URI check (can be enhanced)
        if (!/at:\/\/[a-zA-Z0-9.-]+\/[a-zA-Z0-9.]+\/[a-zA-Z0-9]+/.test(value)) {
          throw new Error(`Invalid AT URI format: ${value}`);
        }
        this.value = value;
      } else {
        throw new Error(`Invalid URI format: ${value}`);
      }
    }
  }

  equals(other: URI): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
