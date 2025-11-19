import { ValueObject } from '../../../../shared/domain/ValueObject';
import { Result, ok, err } from '../../../../shared/core/Result';

export class InvalidChunkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidChunkError';
  }
}

interface ChunkProps {
  value: string;
}

export class Chunk extends ValueObject<ChunkProps> {
  private static readonly MIN_LENGTH = 25;

  get value(): string {
    return this.props.value;
  }

  get length(): number {
    return this.props.value.length;
  }

  private constructor(props: ChunkProps) {
    super(props);
  }

  public static create(
    title?: string,
    description?: string,
  ): Result<Chunk, InvalidChunkError> {
    const content = [title, description].filter(Boolean).join(' ').trim();

    if (content.length < Chunk.MIN_LENGTH) {
      return err(
        new InvalidChunkError(
          `Content too short: ${content.length} characters (minimum: ${Chunk.MIN_LENGTH})`,
        ),
      );
    }

    return ok(new Chunk({ value: content }));
  }

  public static createUnsafe(title?: string, description?: string): Chunk {
    const content = [title, description].filter(Boolean).join(' ').trim();
    return new Chunk({ value: content });
  }

  public static getMinLength(): number {
    return Chunk.MIN_LENGTH;
  }

  public static meetsMinLength(title?: string, description?: string): boolean {
    const content = [title, description].filter(Boolean).join(' ').trim();
    return content.length >= Chunk.MIN_LENGTH;
  }
}
