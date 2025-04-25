import { ValueObject } from "src/shared/domain/ValueObject";
import { AnnotationTemplateField } from "./AnnotationTemplateField";
import { err, ok, Result } from "src/shared/core/Result";
import { Guard } from "src/shared/core/Guard";
import { AnnotationField } from "../aggregates";
import { AnnotationFieldDefProps } from "./AnnotationFieldDefinition";
import { AnnotationType } from "./AnnotationType";
import { AnnotationFieldName } from "./AnnotationFieldName";
import { AnnotationFieldDescription } from "./AnnotationFieldDescription";
import { AnnotationFieldDefinitionFactory } from "../AnnotationFieldDefinitionFactory";
import { CuratorId } from "./CuratorId";
import { AnnotationFieldId } from "./AnnotationFieldId";

export interface AnnotationTemplateFieldInputDTO {
  name: string;
  description: string;
  type: string;
  definition: AnnotationFieldDefProps;
  required?: boolean; // Assuming optional based on AnnotationTemplateField
}
interface AnnotationTemplateFieldsProps {
  fields: AnnotationTemplateField[];
}

interface AnnotationTemplateFieldsFromDtoProps {
  fields: AnnotationTemplateFieldInputDTO[];
  curatorId: string;
}

export class AnnotationTemplateFields extends ValueObject<AnnotationTemplateFieldsProps> {
  get annotationTemplateFields(): AnnotationTemplateField[] {
    return [...this.props.fields];
  }

  getAnnotationFields(): AnnotationField[] {
    return this.props.fields.map((field) => field.annotationField);
  }

  public isEmpty(): boolean {
    return this.props.fields.length === 0;
  }

  public getAnnotationFieldById(
    annotationFieldId: AnnotationFieldId
  ): Result<AnnotationField> {
    const field = this.props.fields.find((field) =>
      field.annotationField.fieldId.equals(annotationFieldId)
    );
    if (!field) {
      return err(new Error("Field not found"));
    }
    return ok(field.annotationField);
  }

  private constructor(props: AnnotationTemplateFieldsProps) {
    super(props);
  }

  public static fromDto(
    props: AnnotationTemplateFieldsFromDtoProps
  ): Result<AnnotationTemplateFields> {
    const annotationTemplateFields: AnnotationTemplateField[] = [];
    for (const field of props.fields) {
      const fieldType = AnnotationType.create(field.type);
      const annotationFieldNameResult = AnnotationFieldName.create(field.name);
      const annotationFieldDescriptionResult =
        AnnotationFieldDescription.create(field.description);
      const annotationFieldDefinitionResult =
        AnnotationFieldDefinitionFactory.create({
          type: fieldType,
          fieldDefProps: field.definition,
        });

      if (
        annotationFieldNameResult.isErr() ||
        annotationFieldDescriptionResult.isErr() ||
        annotationFieldDefinitionResult.isErr()
      ) {
        return err(Error("Invalid field data"));
      }

      const annotationFieldResult = AnnotationField.create({
        curatorId: CuratorId.create(props.curatorId).unwrap(),
        name: annotationFieldNameResult.value,
        description: annotationFieldDescriptionResult.value,
        definition: annotationFieldDefinitionResult.value,
      });

      if (annotationFieldResult.isErr()) {
        return err(Error("Invalid field data"));
      }
      const annotationTemplateFieldResult = AnnotationTemplateField.create({
        annotationField: annotationFieldResult.value,
        required: field.required,
      });
      if (annotationTemplateFieldResult.isErr()) {
        return err(Error("Invalid field data"));
      }
      annotationTemplateFields.push(annotationTemplateFieldResult.value);
    }
    return AnnotationTemplateFields.create(annotationTemplateFields);
  }

  public static create(
    fields: AnnotationTemplateField[]
  ): Result<AnnotationTemplateFields> {
    const guardResult = Guard.againstNullOrUndefined(fields, "fields");
    if (guardResult.isErr()) {
      return fail(guardResult.error);
    }

    if (fields.length === 0) {
      return fail("AnnotationTemplate must include at least one field.");
    }

    return ok(new AnnotationTemplateFields({ fields: [...fields] }));
  }
}
