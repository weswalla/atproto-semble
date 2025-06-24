import { $Typed } from "@atproto/api";
import { AnnotationTemplate } from "src/modules/annotations/domain/aggregates/AnnotationTemplate";
import { AnnotationField } from "src/modules/annotations/domain/aggregates";
import {
  Record,
  AnnotationFieldRef,
} from "../lexicon/types/app/annos/annotationTemplate";
import { StrongRef } from "../../domain";

type AnnotationTemplateRecordDTO = Record;
export class AnnotationTemplateMapper {
  static toCreateRecordDTO(
    template: AnnotationTemplate
  ): AnnotationTemplateRecordDTO {
    return {
      $type: "app.annos.annotationTemplate",
      name: template.name.value,
      description: template.description.value,
      annotationFields: template
        .getAnnotationFields()
        .map((field) =>
          AnnotationTemplateMapper.toAnnotationFieldRef(
            field,
            template.getRequiredFields().includes(field)
          )
        ),
      createdAt: template.createdAt.toISOString(),
    };
  }

  private static toAnnotationFieldRef(
    field: AnnotationField,
    isRequired: boolean
  ): $Typed<AnnotationFieldRef> {
    if (!field.isPublished()) {
      throw new Error(
        `Field ${field.name.value} must be published before it can be referenced`
      );
    }

    const strongRef = new StrongRef(field.publishedRecordId!.getValue());

    return {
      $type: "app.annos.annotationTemplate#annotationFieldRef",
      subject: {
        uri: strongRef.getValue().uri,
        cid: strongRef.getValue().cid,
      },
      required: isRequired,
    };
  }
}
