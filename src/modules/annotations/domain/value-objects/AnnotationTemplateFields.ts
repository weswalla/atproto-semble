import { ValueObject } from "src/shared/domain/ValueObject";
import { AnnotationTemplateField } from "./AnnotationTemplateField";
import { Result } from "src/shared/core/Result";
import { Guard } from "src/shared/core/Guard";
import { UniqueEntityID } from "src/shared/domain/UniqueEntityID";
import { AnnotationFieldId } from "./AnnotationFieldId";

interface AnnotationTemplateFieldsProps {
  fields: AnnotationTemplateField[];
}

export class AnnotationTemplateFields extends ValueObject<AnnotationTemplateFieldsProps> {
  get fields(): AnnotationTemplateField[] {
    return [...this.props.fields];
  }

  getFieldIds(): AnnotationFieldId[] {
    return this.props.fields.map((field) => field.annotationFieldId);
  }

  private constructor(props: AnnotationTemplateFieldsProps) {
    super(props);
  }

  public static create(
    fields: AnnotationTemplateField[]
  ): Result<AnnotationTemplateFields> {
    const guardResult = Guard.againstNullOrUndefined(fields, "fields");
    if (guardResult.isFailure) {
      return Result.fail<AnnotationTemplateFields>(guardResult.getErrorValue());
    }

    if (fields.length === 0) {
      return Result.fail<AnnotationTemplateFields>(
        "AnnotationTemplate must include at least one field."
      );
    }

    // Check for duplicate fields based on AnnotationFieldId
    const fieldIds = fields.map((field) =>
      field.annotationFieldId.getValue().toString()
    );
    const uniqueFieldIds = new Set(fieldIds);
    if (uniqueFieldIds.size !== fieldIds.length) {
      return Result.fail<AnnotationTemplateFields>(
        "AnnotationTemplate cannot contain duplicate fields."
      );
    }

    return Result.ok<AnnotationTemplateFields>(
      new AnnotationTemplateFields({ fields: [...fields] }) // Store a copy
    );
  }

  public findById(
    fieldId: UniqueEntityID
  ): AnnotationTemplateField | undefined {
    return this.props.fields.find((field) =>
      field.annotationFieldId.getValue().equals(fieldId)
    );
  }

  public add(field: AnnotationTemplateField): Result<AnnotationTemplateFields> {
    const guardResult = Guard.againstNullOrUndefined(field, "field");
    if (guardResult.isFailure) {
      return Result.fail<AnnotationTemplateFields>(guardResult.getErrorValue());
    }

    const exists = this.findById(field.annotationFieldId.getValue());
    if (exists) {
      return Result.fail<AnnotationTemplateFields>(
        "Field already exists in the template."
      );
    }

    const newFields = [...this.props.fields, field];
    return AnnotationTemplateFields.create(newFields); // Re-validates and creates new instance
  }

  public remove(
    fieldIdToRemove: UniqueEntityID
  ): Result<AnnotationTemplateFields> {
    const guardResult = Guard.againstNullOrUndefined(
      fieldIdToRemove,
      "fieldIdToRemove"
    );
    if (guardResult.isFailure) {
      return Result.fail<AnnotationTemplateFields>(guardResult.getErrorValue());
    }

    const initialLength = this.props.fields.length;
    const newFields = this.props.fields.filter(
      (field) => !field.annotationFieldId.getValue().equals(fieldIdToRemove)
    );

    if (newFields.length === initialLength) {
      return Result.fail<AnnotationTemplateFields>(
        "Field not found in the template."
      );
    }

    // The create method already checks for emptiness
    return AnnotationTemplateFields.create(newFields);
  }

  public count(): number {
    return this.props.fields.length;
  }

  // Optional: If you need to get the raw array (use with caution)
  public getRawFields(): AnnotationTemplateField[] {
    return this.props.fields;
  }
}
