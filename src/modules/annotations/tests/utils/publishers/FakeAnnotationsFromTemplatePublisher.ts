import { IAnnotationsFromTemplatePublisher, PublishedAnnotationsFromTemplateResult } from "src/modules/annotations/application/ports/IAnnotationsFromTemplatePublisher";
import { AnnotationsFromTemplate } from "src/modules/annotations/domain/aggregates/AnnotationsFromTemplate";
import { AnnotationId, PublishedRecordId } from "src/modules/annotations/domain/value-objects";
import { ok, Result } from "src/shared/core/Result";
import { UseCaseError } from "src/shared/core/UseCaseError";

export class FakeAnnotationsFromTemplatePublisher implements IAnnotationsFromTemplatePublisher {
  private publishedRecords: Map<string, AnnotationsFromTemplate> = new Map();
  private publishedAnnotations: Map<string, PublishedRecordId> = new Map();

  async publish(
    annotationsFromTemplate: AnnotationsFromTemplate
  ): Promise<Result<PublishedAnnotationsFromTemplateResult, UseCaseError>> {
    const templateId = annotationsFromTemplate.template.templateId.getStringValue();
    const publishedRecordIds = new Map<AnnotationId, PublishedRecordId>();
    
    // Generate a fake URI for the template itself
    const fakeTemplateUri = `at://fake-did/app.annos.template/${templateId}`;
    const fakeTemplateCid = `fake-cid-template-${templateId}`;
    const compositeTemplateKey = fakeTemplateUri + fakeTemplateCid;
    
    // Store the published template for inspection
    this.publishedRecords.set(compositeTemplateKey, annotationsFromTemplate);
    
    // Generate fake URIs for each annotation
    for (const annotation of annotationsFromTemplate.annotations) {
      const annotationId = annotation.annotationId;
      const annotationIdString = annotationId.getStringValue();
      
      // Simulate generating an AT URI based on DID and collection/rkey
      const fakeUri = `at://fake-did/app.annos.annotation/${annotationIdString}`;
      const fakeCid = `fake-cid-${annotationIdString}`;
      const publishedRecordId = PublishedRecordId.create({
        uri: fakeUri,
        cid: fakeCid,
      });
      
      // Store the published annotation ID for inspection
      const compositeKey = fakeUri + fakeCid;
      this.publishedAnnotations.set(compositeKey, publishedRecordId);
      
      // Add to the result map
      publishedRecordIds.set(annotationId, publishedRecordId);
      
      console.log(
        `[FakeAnnotationsFromTemplatePublisher] Published annotation ${annotationIdString} to ${fakeUri}`
      );
    }
    
    console.log(
      `[FakeAnnotationsFromTemplatePublisher] Published ${annotationsFromTemplate.annotations.length} annotations from template ${templateId}`
    );
    
    return ok(publishedRecordIds);
  }

  async unpublish(
    recordIds: PublishedRecordId[]
  ): Promise<Result<void, UseCaseError>> {
    for (const recordId of recordIds) {
      const compositeKey = recordId.uri + recordId.cid;
      if (this.publishedAnnotations.has(compositeKey)) {
        this.publishedAnnotations.delete(compositeKey);
        console.log(`[FakeAnnotationsFromTemplatePublisher] Unpublished record ${recordId.uri}`);
      } else {
        console.warn(
          `[FakeAnnotationsFromTemplatePublisher] Record not found for unpublishing: ${recordId.uri}`
        );
      }
    }
    
    return ok(undefined);
  }
  
  // Helper method to get all published annotations
  getPublishedAnnotations(): Map<string, PublishedRecordId> {
    return new Map(this.publishedAnnotations);
  }
  
  // Helper method to get all published templates
  getPublishedTemplates(): Map<string, AnnotationsFromTemplate> {
    return new Map(this.publishedRecords);
  }
  
  // Helper method to clear all published records (useful for tests)
  clearPublishedRecords(): void {
    this.publishedRecords.clear();
    this.publishedAnnotations.clear();
  }
}
