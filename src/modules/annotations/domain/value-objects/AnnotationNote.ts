import { ValueObject } from "../../../../shared/domain/ValueObject";
import { Result, ok, err } from "../../../../shared/core/Result";

export class InvalidNoteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNoteError';
  }
}

export class AnnotationNote extends ValueObject<{ value: string }> {
  public static readonly MAX_LENGTH = 1000;

  getValue(): string {
    return this.props.value;
  }

  private constructor(props: { value: string }) {
    super(props);
  }

  public static create(value: string): Result<AnnotationNote, InvalidNoteError> {
    if (!value || value.trim().length === 0) {
      return err(new InvalidNoteError("Annotation note cannot be empty"));
    }

    if (value.length > this.MAX_LENGTH) {
      return err(new InvalidNoteError(`Note exceeds maximum length of ${this.MAX_LENGTH} characters`));
    }

    return ok(new AnnotationNote({ value: value.trim() }));
  }
}
