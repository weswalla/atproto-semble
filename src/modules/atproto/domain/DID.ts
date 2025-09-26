import { ValueObject } from '../../../shared/domain/ValueObject';
import { err, ok, Result } from '../../../shared/core/Result';

// Use the same validation as the CuratorId - allows did:plc and potentially did:web
const DID_REGEX = /^did:(plc:[a-zA-Z0-9]+|web:[a-zA-Z0-9.%-]+)$/;

export class InvalidDIDError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDIDError';
  }
}

interface DIDProps {
  value: string;
}

export class DID extends ValueObject<DIDProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: DIDProps) {
    super(props);
  }

  public static create(did: string): Result<DID, InvalidDIDError> {
    const didTrimmed = did.trim();
    if (didTrimmed.length === 0) {
      return err(new InvalidDIDError('DID cannot be empty'));
    }

    if (!DID_REGEX.test(didTrimmed)) {
      return err(
        new InvalidDIDError(
          `Invalid DID format (must be a valid DID): ${didTrimmed}`,
        ),
      );
    }

    return ok(new DID({ value: didTrimmed }));
  }

  public toString(): string {
    return this.props.value;
  }

  public equals(other: DID): boolean {
    return this.props.value === other.props.value;
  }
}
