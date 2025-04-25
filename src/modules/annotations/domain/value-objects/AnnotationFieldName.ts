import { ValueObject } from "../../../../shared/domain/ValueObject";
import { err, ok, Result } from "../../../../shared/core/Result";

interface AnnotationFieldNameProps {
  value: string;
}

export class AnnotationFieldName extends ValueObject<AnnotationFieldNameProps> {
  public static readonly MAX_LENGTH = 100; // Example max length

  get value(): string {
    return this.props.value;
  }

  private constructor(props: AnnotationFieldNameProps) {
    super(props);
  }

  public static create(name: string): Result<AnnotationFieldName> {
    const nameTrimmed = name?.trim(); // Handle potential null/undefined input

    if (nameTrimmed.length === 0) {
      return err(Error("AnnotationField name cannot be empty."));
    }

    if (nameTrimmed.length > this.MAX_LENGTH) {
      return err(
        Error(
          `AnnotationField name exceeds maximum length of ${this.MAX_LENGTH} characters.`
        )
      );
    }

    return ok(new AnnotationFieldName({ value: nameTrimmed }));
  }
}
