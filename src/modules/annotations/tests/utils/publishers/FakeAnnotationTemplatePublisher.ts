import { IAnnotationTemplatePublisher } from "src/modules/annotations/application/ports/IAnnotationTemplatePublisher";
import { AnnotationTemplate } from "src/modules/annotations/domain/aggregates";
import {
  PublishedRecordId,
  PublishedRecordIdProps,
} from "src/modules/annotations/domain/value-objects";
import { ok, Result } from "src/shared/core/Result";
import { UseCaseError } from "src/shared/core/UseCaseError";
import { FakeAnnotationFieldPublisher } from "./FakeAnnotationFieldPublisher";
import { IAnnotationFieldRepository } from "src/modules/annotations/application/repositories/IAnnotationFieldRepository";

export class FakeAnnotationTemplatePublisher
  implements IAnnotationTemplatePublisher
{
  private publishedRecords: Map<string, AnnotationTemplate> = new Map();

  constructor(
    private readonly fieldPublisher?: FakeAnnotationFieldPublisher,
    private readonly fieldRepository?: IAnnotationFieldRepository
  ) {}

  async publish(
    template: AnnotationTemplate
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    const templateId = template.templateId.getStringValue();
    // Simulate generating an AT URI based on DID and collection/rkey
    const fakeUri = `at://fake-did/network.cosmik.template/${templateId}`;
    const fakeCid = `fake-cid-${templateId}`;
    const publishedRecordId = PublishedRecordId.create({
      uri: fakeUri,
      cid: fakeCid,
    });

    // Store the published template for inspection using composite key
    const compositeKey = fakeUri + fakeCid;
    this.publishedRecords.set(compositeKey, template);

    // If we have a field publisher and repository, publish all fields in the template
    // and save them to the repository
    if (this.fieldPublisher && this.fieldRepository) {
      // Get all fields from the template
      const fields = template.getAnnotationFields();

      // Publish each field and save to repository
      for (const field of fields) {
        const fieldPublishResult = await this.fieldPublisher.publish(field);
        if (fieldPublishResult.isOk()) {
          // Mark the field as published
          field.markAsPublished(fieldPublishResult.value);

          // Save the field to the repository
          await this.fieldRepository.save(field);

          console.log(
            `[FakeAnnotationTemplatePublisher] Published and saved field ${field.fieldId.getStringValue()}`
          );
        }
      }
    }

    console.log(
      `[FakeAnnotationTemplatePublisher] Published template ${templateId} to ${fakeUri}`
    );
    return ok(publishedRecordId);
  }

  async unpublish(
    recordId: PublishedRecordId
  ): Promise<Result<void, UseCaseError>> {
    const compositeKey = recordId.uri + recordId.cid;
    if (this.publishedRecords.has(compositeKey)) {
      this.publishedRecords.delete(compositeKey);
      console.log(
        `[FakeAnnotationTemplatePublisher] Unpublished record ${recordId.uri}`
      );
      return ok(undefined); // Use ok(undefined) for void success
    } else {
      console.warn(
        `[FakeAnnotationTemplatePublisher] Record not found for unpublishing: ${recordId.uri}`
      );
      // Depending on requirements, you might return an error here
      // For a simple fake, we can still return success
      return ok(undefined);
    }
  }
}
