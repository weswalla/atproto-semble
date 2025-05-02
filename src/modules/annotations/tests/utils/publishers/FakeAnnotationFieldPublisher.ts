import { IAnnotationFieldPublisher } from "../../../application/ports/IAnnotationFieldPublisher";
import { AnnotationField } from "../../../domain/AnnotationField";
import {
  PublishedRecordId,
  PublishedRecordIdProps,
} from "../../../domain/value-objects/PublishedRecordId";
import { Result, ok } from "../../../../../shared/core/Result";
import { UseCaseError } from "../../../../../shared/core/UseCaseError";

export class FakeAnnotationFieldPublisher implements IAnnotationFieldPublisher {
  private publishedRecords: Map<string, AnnotationField> = new Map();

  async publish(
    field: AnnotationField
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    const fieldId = field.fieldId.getStringValue();
    // Simulate generating an AT URI based on DID and collection/rkey
    const fakeUri = `at://fake-did/app.annos.field/${fieldId}`;
    const fakeCid = `fake-cid-${fieldId}`;
    const publishedRecordId = PublishedRecordId.create({
      uri: fakeUri,
      cid: fakeCid,
    });

    // Store the published field for inspection using composite key
    const compositeKey = fakeUri + fakeCid;
    this.publishedRecords.set(compositeKey, field);

    console.log(
      `[FakeAnnotationFieldPublisher] Published field ${fieldId} to ${fakeUri}`
    );
    return ok(publishedRecordId);
  }

  async unpublish(
    recordId: PublishedRecordId
  ): Promise<Result<void, UseCaseError>> {
    const compositeKey = recordId.uri + recordId.cid;
    if (this.publishedRecords.has(compositeKey)) {
      this.publishedRecords.delete(compositeKey);
      console.log(`[FakeAnnotationFieldPublisher] Unpublished record ${recordId.uri}`);
      return ok(undefined); // Use ok(undefined) for void success
    } else {
      console.warn(
        `[FakeAnnotationFieldPublisher] Record not found for unpublishing: ${recordId.uri}`
      );
      // Depending on requirements, you might return an error here
      // For a simple fake, we can still return success
      return ok(undefined);
    }
  }
}
