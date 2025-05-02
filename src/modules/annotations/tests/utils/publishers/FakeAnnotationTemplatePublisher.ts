import { IAnnotationTemplatePublisher } from "src/modules/annotations/application/ports/IAnnotationTemplatePublisher";
import { AnnotationTemplate } from "src/modules/annotations/domain/aggregates";
import {
  PublishedRecordId,
  PublishedRecordIdProps,
} from "src/modules/annotations/domain/value-objects";
import { ok, Result } from "src/shared/core/Result";
import { UseCaseError } from "src/shared/core/UseCaseError";

export class FakeAnnotationTemplatePublisher
  implements IAnnotationTemplatePublisher
{
  private publishedRecords: Map<PublishedRecordIdProps, AnnotationTemplate> =
    new Map();

  async publish(
    template: AnnotationTemplate
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    const templateId = template.templateId.getStringValue();
    // Simulate generating an AT URI based on DID and collection/rkey
    const fakeUri = `at://fake-did/app.annos.template/${templateId}`;
    const fakeCid = `fake-cid-${templateId}`;
    const publishedRecordId = PublishedRecordId.create({
      uri: fakeUri,
      cid: fakeCid,
    });

    // Store the published template for inspection if needed
    this.publishedRecords.set(publishedRecordId.getValue(), template);

    console.log(
      `[FakeAnnotationTemplatePublisher] Published template ${templateId} to ${fakeUri}`
    );
    return ok(publishedRecordId);
  }

  async unpublish(
    recordId: PublishedRecordId
  ): Promise<Result<void, UseCaseError>> {
    const uri = recordId.getValue();
    if (this.publishedRecords.has(uri)) {
      this.publishedRecords.delete(uri);
      console.log(
        `[FakeAnnotationTemplatePublisher] Unpublished record ${uri}`
      );
      return ok(undefined); // Use ok(undefined) for void success
    } else {
      console.warn(
        `[FakeAnnotationTemplatePublisher] Record not found for unpublishing: ${uri}`
      );
      // Depending on requirements, you might return an error here
      // For a simple fake, we can still return success
      return ok(undefined);
    }
  }
}
