// Basic validation for DID format (can be enhanced)
const DID_REGEX = /^did:plc:[a-zA-Z0-9]+$/;

/**
 * Represents a validated Decentralized Identifier (DID), specifically a did:plc.
 */
export class DID {
  readonly value: string;

  constructor(value: string) {
    if (!DID_REGEX.test(value)) {
      throw new Error(`Invalid DID format: ${value}`);
    }
    this.value = value;
  }

  toString(): string {
    return this.value;
  }
}
