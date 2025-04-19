import { ValueObject } from "src/shared/domain/ValueObject";
import { AnnotationFieldId } from "./AnnotationFieldId";
import { Result } from "src/shared/core/Result";
import { Guard } from "src/shared/core/Guard";

interface AnnotationTemplateFieldProps {
  annotationFieldId: AnnotationFieldId;
  required?: boolean;
}
export class AnnotationTemplateField extends ValueObject<{
  annotationFieldId: AnnotationFieldId;
  required?: boolean;
}> {
  get annotationFieldId(): AnnotationFieldId {
    return this.props.annotationFieldId;
  }
  get required(): boolean {
    return this.props.required ?? false;
  }

  private constructor(props: AnnotationTemplateFieldProps) {
    super(props);
  }
  public static create(
    props: AnnotationTemplateFieldProps
  ): Result<AnnotationTemplateField> {
    const nullGuard = Guard.againstNullOrUndefined(
      props.annotationFieldId,
      "annotationFieldId"
    );
    if (nullGuard.isFailure) {
      return Result.fail<AnnotationTemplateField>(nullGuard.getErrorValue());
    }
    return Result.ok<AnnotationTemplateField>(
      new AnnotationTemplateField(props)
    );
  }
}
