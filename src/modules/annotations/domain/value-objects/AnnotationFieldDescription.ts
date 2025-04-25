import { ValueObject } from "../../../../shared/domain/ValueObject";
import { ok, Result } from "../../../../shared/core/Result";

interface AnnotationFieldDescriptionProps {
  value: string;
}

export class AnnotationFieldDescription extends ValueObject<AnnotationFieldDescriptionProps> {
  public static readonly MAX_LENGTH = 500; // Example max length

  get value(): string {
    return this.props.value;
  }

  private constructor(props: AnnotationFieldDescriptionProps) {
    super(props);
  }

  public static create(
    description: string
  ): Result<AnnotationFieldDescription> {
    const descriptionTrimmed = description.trim();

    if (descriptionTrimmed.length > this.MAX_LENGTH) {
      return fail(
        `AnnotationField description exceeds maximum length of ${this.MAX_LENGTH} characters.`
      );
    }

    return ok(new AnnotationFieldDescription({ value: descriptionTrimmed }));
  }
}
