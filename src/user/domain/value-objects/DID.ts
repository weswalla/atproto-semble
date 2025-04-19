import { ValueObject } from "../../../shared/domain/ValueObject";
import { Result } from "../../../shared/core/Result";
import { Guard } from "../../../shared/core/Guard";

// Basic validation for DID format (can be enhanced)
// Allows did:plc and potentially did:web, adjust regex if needed
const DID_REGEX = /^did:(plc:[a-zA-Z0-9]+|web:[a-zA-Z0-9.%-]+)$/;

interface DIDProps {
  value: string;
}

/**
 * Represents a validated Decentralized Identifier (DID).
 */
export class DID extends ValueObject<DIDProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: DIDProps) {
    super(props);
  }

  public static create(did: string): Result<DID> {
    const guardResult = Guard.againstNullOrUndefined(did, "did");
    if (guardResult.isFailure) {
      return Result.fail<DID>(guardResult.getErrorValue());
    }

    const didTrimmed = did.trim();
    if (didTrimmed.length === 0) {
      return Result.fail<DID>("DID cannot be empty.");
    }

    if (!DID_REGEX.test(didTrimmed)) {
      return Result.fail<DID>(`Invalid DID format: ${didTrimmed}`);
    }

    return Result.ok<DID>(new DID({ value: didTrimmed }));
  }

  toString(): string {
    return this.props.value;
  }
}
