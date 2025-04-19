import { ValueObject } from "../../../../shared/domain/ValueObject";
import { Result } from "../../../../shared/core/Result";
import { Guard } from "../../../../shared/core/Guard";

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

    const guardResult = Guard.againstNullOrUndefined(nameTrimmed, "name");
    if (guardResult.isFailure) {
      return Result.fail<AnnotationTemplateName>(guardResult.getErrorValue());
    }

    if (nameTrimmed.length === 0) {
        return Result.fail<AnnotationTemplateName>("AnnotationTemplate name cannot be empty.");
    }

    if (nameTrimmed.length > this.MAX_LENGTH) {
      return Result.fail<AnnotationTemplateName>(
        `AnnotationTemplate name exceeds maximum length of ${this.MAX_LENGTH} characters.`
      );
    }

    return Result.ok<AnnotationTemplateName>(new AnnotationTemplateName({ value: nameTrimmed }));
  }
}
