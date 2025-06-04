import { ValueObject } from '../../../../shared/domain/ValueObject';
import { Result, ok, err } from '../../../../shared/core/Result';

export class InvalidURLError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidURLError';
  }
}

interface URLProps {
  value: string;
}

export class URL extends ValueObject<URLProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: URLProps) {
    super(props);
  }

  public static create(url: string): Result<URL, InvalidURLError> {
    if (!url || url.trim().length === 0) {
      return err(new InvalidURLError('URL cannot be empty'));
    }

    const trimmedUrl = url.trim();

    try {
      // Validate URL format using the global URL constructor
      new globalThis.URL(trimmedUrl);
      return ok(new URL({ value: trimmedUrl }));
    } catch (error) {
      return err(new InvalidURLError('Invalid URL format'));
    }
  }

  public toString(): string {
    return this.value;
  }
}
