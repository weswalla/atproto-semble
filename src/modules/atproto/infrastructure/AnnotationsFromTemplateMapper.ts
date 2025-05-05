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
      const record = AnnotationMapper.toCreateRecordDTO(annotation);
      const annotationId = annotation.annotationId.getStringValue();
      
      // Generate a deterministic rkey based on the annotation ID
      const rkey = `annotation-${annotationId}`;
      
      // Create the write operation
      operations.push({
        $type: "com.atproto.repo.applyWrites#create",
        collection,
        rkey,
        value: record
      });
    }

    return operations;
  }

  /**
   * Generates rkeys for each annotation in the template
   * This is useful for constructing URIs after publishing
   */
  static generateRkeys(
    annotationsFromTemplate: AnnotationsFromTemplate
  ): Map<string, string> {
    const annotations = annotationsFromTemplate.annotations;
    const rkeys = new Map<string, string>();

    for (const annotation of annotations) {
      const annotationId = annotation.annotationId.getStringValue();
      const rkey = `annotation-${annotationId}`;
      rkeys.set(annotationId, rkey);
    }

    return rkeys;
  }
}
