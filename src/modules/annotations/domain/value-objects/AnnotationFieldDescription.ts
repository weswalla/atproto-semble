import { ValueObject } from "../../../../shared/domain/ValueObject";
import { Result } from "../../../../shared/core/Result";
import { Guard } from "../../../../shared/core/Guard";

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

  public static create(description: string): Result<AnnotationFieldDescription> {
    // Description can potentially be empty, so only check length if provided
    const descriptionTrimmed = description?.trim();

    const guardResult = Guard.againstNullOrUndefined(descriptionTrimmed, "description");
     if (guardResult.isFailure) {
       // Allow null/undefined to pass through, representing an empty description
       // If description MUST exist, change this logic
       return Result.ok<AnnotationFieldDescription>(new AnnotationFieldDescription({ value: "" }));
     }

    if (descriptionTrimmed.length > this.MAX_LENGTH) {
      return Result.fail<AnnotationFieldDescription>(
        `AnnotationField description exceeds maximum length of ${this.MAX_LENGTH} characters.`
      );
    }

    return Result.ok<AnnotationFieldDescription>(new AnnotationFieldDescription({ value: descriptionTrimmed }));
  }
}
