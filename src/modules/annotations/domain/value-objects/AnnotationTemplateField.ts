import { ValueObject } from "src/shared/domain/ValueObject";
import { ok, Result } from "src/shared/core/Result";
import { Guard } from "src/shared/core/Guard";
import { AnnotationField } from "../aggregates";

interface AnnotationTemplateFieldProps {
  annotationField: AnnotationField;
  required?: boolean;
}
export class AnnotationTemplateField extends ValueObject<{
  annotationField: AnnotationField;
  required?: boolean;
}> {
  get annotationField(): AnnotationField {
    return this.props.annotationField;
  }
  isRequired(): boolean {
    return this.props.required ?? false;
  }

  private constructor(props: AnnotationTemplateFieldProps) {
    super(props);
  }
  public static create(
    props: AnnotationTemplateFieldProps
  ): Result<AnnotationTemplateField> {
    const nullGuard = Guard.againstNullOrUndefined(
      props.annotationField,
      "annotationField"
    );
    if (nullGuard.isErr()) {
      return fail(nullGuard.error);
    }
    return ok(new AnnotationTemplateField(props));
  }
}
