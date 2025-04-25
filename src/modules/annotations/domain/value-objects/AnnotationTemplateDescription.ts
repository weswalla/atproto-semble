import { ValueObject } from "../../../../shared/domain/ValueObject";
import { ok, Result } from "../../../../shared/core/Result";
import { Guard } from "../../../../shared/core/Guard";

interface AnnotationTemplateDescriptionProps {
  value: string;
}

export class AnnotationTemplateDescription extends ValueObject<AnnotationTemplateDescriptionProps> {
  public static readonly MAX_LENGTH = 500; // Example max length

  get value(): string {
    return this.props.value;
  }

  private constructor(props: AnnotationTemplateDescriptionProps) {
    super(props);
  }

  public static create(
    description: string
  ): Result<AnnotationTemplateDescription> {
    const descriptionTrimmed = description.trim();

    if (descriptionTrimmed.length > this.MAX_LENGTH) {
      return fail(
        `AnnotationTemplate description exceeds maximum length of ${this.MAX_LENGTH} characters.`
      );
    }

    return ok(new AnnotationTemplateDescription({ value: descriptionTrimmed }));
  }
}
