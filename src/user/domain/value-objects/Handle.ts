// Basic validation for handle format (can be enhanced)
const HANDLE_REGEX = /^[a-zA-Z0-9.-]+\.[a-zA-Z]+$/;

/**
 * Represents a validated ATProto handle.
 */
export class Handle {
  readonly value: string;

  constructor(value: string) {
    if (!HANDLE_REGEX.test(value)) {
      // Consider relaxing this if needed, ATProto handle validation is complex
      throw new Error(`Invalid Handle format: ${value}`);
    }
    this.value = value;
  }

  toString(): string {
    return this.value;
  }
}
