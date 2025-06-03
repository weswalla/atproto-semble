import { ValueObject } from '../../../../shared/domain/ValueObject';
import { Result } from '../../../../shared/core/Result';

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

  public static create(url: string): Result<URL> {
    if (!url || url.trim().length === 0) {
      return Result.fail<URL>('URL cannot be empty');
    }

    try {
      // Validate URL format
      new globalThis.URL(url);
      return Result.ok<URL>(new URL({ value: url.trim() }));
    } catch (error) {
      return Result.fail<URL>('Invalid URL format');
    }
  }

  public toString(): string {
    return this.value;
  }
}
