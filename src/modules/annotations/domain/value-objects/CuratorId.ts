import { ValueObject } from "../../../../shared/domain/ValueObject";
import { ok, Result } from "../../../../shared/core/Result";

// Use the same validation as the generic DID value object
// Allows did:plc and potentially did:web, adjust regex if needed
const DID_REGEX = /^did:(plc:[a-zA-Z0-9]+|web:[a-zA-Z0-9.%-]+)$/;

interface CuratorIdProps {
  value: string; // The DID string
}

/**
 * Represents the validated Decentralized Identifier (DID) of the curator
 * who created the annotation.
 */
export class CuratorId extends ValueObject<CuratorIdProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: CuratorIdProps) {
    super(props);
  }

  public static create(did: string): Result<CuratorId> {
    const didTrimmed = did.trim();
    if (didTrimmed.length === 0) {
      return fail("CuratorId cannot be empty.");
    }

    if (!DID_REGEX.test(didTrimmed)) {
      return fail(
        `Invalid CuratorId format (must be a valid DID): ${didTrimmed}`
      );
    }

    return ok(new CuratorId({ value: didTrimmed }));
  }

  toString(): string {
    return this.props.value;
  }
}
