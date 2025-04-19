import { ValueObject } from "../../../../shared/domain/ValueObject";
import { Result } from "../../../../shared/core/Result";
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

  public static create(description: string): Result<AnnotationTemplateDescription> {
    const descriptionTrimmed = description?.trim();

    const guardResult = Guard.againstNullOrUndefined(descriptionTrimmed, "description");
     if (guardResult.isFailure) {
       // Allow null/undefined to pass through, representing an empty description
       return Result.ok<AnnotationTemplateDescription>(new AnnotationTemplateDescription({ value: "" }));
     }

    if (descriptionTrimmed.length > this.MAX_LENGTH) {
      return Result.fail<AnnotationTemplateDescription>(
        `AnnotationTemplate description exceeds maximum length of ${this.MAX_LENGTH} characters.`
      );
    }

    return Result.ok<AnnotationTemplateDescription>(new AnnotationTemplateDescription({ value: descriptionTrimmed }));
  }
}
