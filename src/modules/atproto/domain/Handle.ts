import { ValueObject } from '../../../shared/domain/ValueObject';
import { Result, ok, err } from '../../../shared/core/Result';

export class InvalidHandleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidHandleError';
  }
}

interface HandleProps {
  value: string;
}

export class Handle extends ValueObject<HandleProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: HandleProps) {
    super(props);
  }

  public static create(handle: string): Result<Handle, InvalidHandleError> {
    if (!handle || handle.trim().length === 0) {
      return err(new InvalidHandleError('Handle cannot be empty'));
    }

    const trimmedHandle = handle.trim();

    // Basic domain validation - must contain at least one dot and valid characters
    if (!Handle.isValidDomain(trimmedHandle)) {
      return err(new InvalidHandleError('Handle must be a valid domain'));
    }

    return ok(new Handle({ value: trimmedHandle }));
  }

  private static isValidDomain(domain: string): boolean {
    // Basic domain validation
    // Must contain at least one dot
    if (!domain.includes('.')) {
      return false;
    }

    // Must not start or end with dot or hyphen
    if (domain.startsWith('.') || domain.endsWith('.') || 
        domain.startsWith('-') || domain.endsWith('-')) {
      return false;
    }

    // Split by dots and validate each part
    const parts = domain.split('.');
    if (parts.length < 2) {
      return false;
    }

    for (const part of parts) {
      if (!Handle.isValidDomainPart(part)) {
        return false;
      }
    }

    return true;
  }

  private static isValidDomainPart(part: string): boolean {
    // Each part must be 1-63 characters
    if (part.length === 0 || part.length > 63) {
      return false;
    }

    // Must not start or end with hyphen
    if (part.startsWith('-') || part.endsWith('-')) {
      return false;
    }

    // Must contain only alphanumeric characters and hyphens
    const validChars = /^[a-zA-Z0-9-]+$/;
    return validChars.test(part);
  }

  public toString(): string {
    return this.props.value;
  }

  public equals(other: Handle): boolean {
    return this.props.value === other.props.value;
  }
}
