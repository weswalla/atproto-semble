import { ValueObject } from "../../../../shared/domain/ValueObject";
import { Result, ok, err } from "../../../../shared/core/Result";

export class InvalidCollectionDescriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCollectionDescriptionError";
  }
}

interface CollectionDescriptionProps {
  value: string;
}

export class CollectionDescription extends ValueObject<CollectionDescriptionProps> {
  public static readonly MAX_LENGTH = 500;

  get value(): string {
    return this.props.value;
  }

  private constructor(props: CollectionDescriptionProps) {
    super(props);
  }

  public static create(description: string): Result<CollectionDescription, InvalidCollectionDescriptionError> {
    const trimmedDescription = description.trim();

    if (trimmedDescription.length > this.MAX_LENGTH) {
      return err(new InvalidCollectionDescriptionError(`Collection description cannot exceed ${this.MAX_LENGTH} characters`));
    }

    return ok(new CollectionDescription({ value: trimmedDescription }));
  }

  public toString(): string {
    return this.value;
  }
}
