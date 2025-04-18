import { ValueObject } from "src/shared/domain/ValueObject";

export class AnnotationNote extends ValueObject<{ value: string }> {
  getValue(): string {
    return this.props.value;
  }

  private constructor(value: string) {
    super({ value });
  }

  public static create(value: string): AnnotationNote {
    if (value.length > 1000) {
      throw new Error(
        "Annotation note exceeds maximum length of 1000 characters."
      );
    }
    return new AnnotationNote(value);
  }
}
