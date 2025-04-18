import { ValueObject } from "../../../../shared/domain/ValueObject";
import { Result } from "../../../../shared/core/Result";
import { Guard } from "../../../../shared/core/Guard";

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

    const guardResult = Guard.againstNullOrUndefined(nameTrimmed, "name");
    if (guardResult.isFailure) {
      return Result.fail<AnnotationFieldName>(guardResult.getErrorValue());
    }

    if (nameTrimmed.length === 0) {
        return Result.fail<AnnotationFieldName>("AnnotationField name cannot be empty.");
    }

    if (nameTrimmed.length > this.MAX_LENGTH) {
      return Result.fail<AnnotationFieldName>(
        `AnnotationField name exceeds maximum length of ${this.MAX_LENGTH} characters.`
      );
    }

    return Result.ok<AnnotationFieldName>(new AnnotationFieldName({ value: nameTrimmed }));
  }
}
