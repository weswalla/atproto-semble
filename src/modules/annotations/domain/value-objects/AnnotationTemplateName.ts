import { ValueObject } from "../../../../shared/domain/ValueObject";
import { err, ok, Result } from "../../../../shared/core/Result";

interface AnnotationTemplateNameProps {
  value: string;
}

export class AnnotationTemplateName extends ValueObject<AnnotationTemplateNameProps> {
  public static readonly MAX_LENGTH = 100; // Example max length

  get value(): string {
    return this.props.value;
  }

  private constructor(props: AnnotationTemplateNameProps) {
    super(props);
  }

  public static create(name: string): Result<AnnotationTemplateName> {
    const nameTrimmed = name?.trim();

    if (nameTrimmed.length === 0) {
      return err(Error("AnnotationTemplate name cannot be empty."));
    }

    if (nameTrimmed.length > this.MAX_LENGTH) {
      return err(
        Error(
          `AnnotationTemplate name exceeds maximum length of ${this.MAX_LENGTH} characters.`
        )
      );
    }

    return ok(new AnnotationTemplateName({ value: nameTrimmed }));
  }
}
