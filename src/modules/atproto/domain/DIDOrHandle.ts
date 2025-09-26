import { ValueObject } from '../../../shared/domain/ValueObject';
import { Result, ok, err } from '../../../shared/core/Result';
import { DID } from './DID';
import { Handle, InvalidHandleError } from './Handle';

export class InvalidDIDOrHandleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDIDOrHandleError';
  }
}

interface DIDOrHandleProps {
  value: string;
  isDID: boolean;
  did?: DID;
  handle?: Handle;
}

export class DIDOrHandle extends ValueObject<DIDOrHandleProps> {
  get value(): string {
    return this.props.value;
  }

  get isDID(): boolean {
    return this.props.isDID;
  }

  get isHandle(): boolean {
    return !this.props.isDID;
  }

  private constructor(props: DIDOrHandleProps) {
    super(props);
  }

  public static create(value: string): Result<DIDOrHandle, InvalidDIDOrHandleError> {
    if (!value || value.trim().length === 0) {
      return err(new InvalidDIDOrHandleError('Value cannot be empty'));
    }

    const trimmedValue = value.trim();

    // Check if it's a DID first
    if (trimmedValue.startsWith('did:')) {
      try {
        const did = new DID(trimmedValue);
        return ok(new DIDOrHandle({
          value: trimmedValue,
          isDID: true,
          did,
        }));
      } catch (error) {
        return err(new InvalidDIDOrHandleError(`Invalid DID: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    }

    // Otherwise, try to parse as handle
    const handleResult = Handle.create(trimmedValue);
    if (handleResult.isErr()) {
      return err(new InvalidDIDOrHandleError(`Invalid handle: ${handleResult.error.message}`));
    }

    return ok(new DIDOrHandle({
      value: trimmedValue,
      isDID: false,
      handle: handleResult.value,
    }));
  }

  public getDID(): DID | undefined {
    return this.props.did;
  }

  public getHandle(): Handle | undefined {
    return this.props.handle;
  }

  public toString(): string {
    return this.props.value;
  }

  public equals(other: DIDOrHandle): boolean {
    return this.props.value === other.props.value && this.props.isDID === other.props.isDID;
  }
}
