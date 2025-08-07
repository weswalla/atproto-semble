import { ValueObject } from '../../../../shared/domain/ValueObject';
import { Result, ok, err } from '../../../../shared/core/Result';

export class InvalidCollectionNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCollectionNameError';
  }
}

interface CollectionNameProps {
  value: string;
}

export class CollectionName extends ValueObject<CollectionNameProps> {
  public static readonly MAX_LENGTH = 100;

  get value(): string {
    return this.props.value;
  }

  private constructor(props: CollectionNameProps) {
    super(props);
  }

  public static create(
    name: string,
  ): Result<CollectionName, InvalidCollectionNameError> {
    if (!name || name.trim().length === 0) {
      return err(
        new InvalidCollectionNameError('Collection name cannot be empty'),
      );
    }

    const trimmedName = name.trim();

    if (trimmedName.length > this.MAX_LENGTH) {
      return err(
        new InvalidCollectionNameError(
          `Collection name cannot exceed ${this.MAX_LENGTH} characters`,
        ),
      );
    }

    return ok(new CollectionName({ value: trimmedName }));
  }

  public toString(): string {
    return this.value;
  }
}
