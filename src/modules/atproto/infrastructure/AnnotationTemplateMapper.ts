import { $Typed } from "@atproto/api";
import { AnnotationTemplate } from "src/modules/annotations/domain/aggregates/AnnotationTemplate";
import { AnnotationField } from "src/modules/annotations/domain/aggregates";
import { Record, AnnotationFieldRef } from "./lexicon/types/app/annos/annotationTemplate";
import { ComAtprotoRepoStrongRef } from "@atproto/api";
import { ATUri } from "../domain/ATUri";

export class AnnotationTemplateMapper {
  static toCreateRecordDTO(template: AnnotationTemplate): Record {
    return {
      $type: "app.annos.annotationTemplate",
      name: template.name.value,
      description: template.description.value,
      annotationFields: template.getAnnotationFields().map(field => 
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
      throw new Error(`Field ${field.name.value} must be published before it can be referenced`);
    }

    const uri = field.publishedRecordId!.getValue();
    const atUri = new ATUri(uri);

    return {
      $type: "app.annos.annotationTemplate#annotationFieldRef",
      ref: {
        $type: "com.atproto.repo.strongRef",
        uri: uri,
        cid: atUri.cid,
      },
      required: isRequired,
    };
  }
}
