import { AnnotationsFromTemplate } from "src/modules/annotations/domain/aggregates/AnnotationsFromTemplate";
import { AnnotationMapper } from "./AnnotationMapper";
import { Create } from "@atproto/api/dist/client/types/com/atproto/repo/applyWrites";
import { $Typed } from "@atproto/api";

export class AnnotationsFromTemplateMapper {
  /**
   * Converts an AnnotationsFromTemplate domain object to an array of create operations
   * for the AT Protocol's applyWrites method
   */
  static toCreateOperations(
    annotationsFromTemplate: AnnotationsFromTemplate,
    collection: string = "app.annos.annotation"
  ): $Typed<Create>[] {
    const annotations = annotationsFromTemplate.annotations;
    const operations: $Typed<Create>[] = [];

    for (const annotation of annotations) {
      const record = AnnotationMapper.toCreateRecordDTOFromTemplate(
        annotation,
        annotationsFromTemplate.template
      );

      // Create the write operation
      operations.push({
        $type: "com.atproto.repo.applyWrites#create",
        collection,
        value: record,
      });
    }

    return operations;
  }
}
