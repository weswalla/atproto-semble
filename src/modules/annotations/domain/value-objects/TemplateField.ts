import { ValueObject } from "src/shared/domain/ValueObject";
import { AnnotationFieldId } from "./AnnotationFieldId";
import { Result } from "src/shared/core/Result";
import { Guard } from "src/shared/core/Guard";

interface TemplateFieldProps {
  annotationFieldId: AnnotationFieldId;
  required?: boolean;
}
export class TemplateField extends ValueObject<{
  annotationFieldId: AnnotationFieldId;
  required?: boolean;
}> {
  get annotationFieldId(): AnnotationFieldId {
    return this.props.annotationFieldId;
  }
  get required(): boolean {
    return this.props.required ?? false;
  }

  private constructor(props: TemplateFieldProps) {
    super(props);
  }
  public static create(props: TemplateFieldProps): Result<TemplateField> {
    const nullGuard = Guard.againstNullOrUndefined(
      props.annotationFieldId,
      "annotationFieldId"
    );
    if (nullGuard.isFailure) {
      return Result.fail<TemplateField>(nullGuard.getErrorValue());
    }
    return Result.ok<TemplateField>(new TemplateField(props));
  }
}
