import { ValueObject } from '../../../../shared/domain/ValueObject';
import { UrlMetadata } from '../../../cards/domain/value-objects/UrlMetadata';

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

  public static create(metadata: UrlMetadata): Chunk {
    const content = [metadata.title, metadata.description]
      .filter(Boolean)
      .join(' ')
      .trim();
    return new Chunk({ value: content });
  }

  public meetsMinLength(): boolean {
    return this.props.value.length >= Chunk.MIN_LENGTH;
  }

  public static getMinLength(): number {
    return Chunk.MIN_LENGTH;
  }
}
