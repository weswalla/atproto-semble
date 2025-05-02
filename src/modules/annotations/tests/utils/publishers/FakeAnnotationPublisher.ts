import { IAnnotationPublisher } from "src/modules/annotations/application/ports/IAnnotationPublisher";
import { Annotation } from "src/modules/annotations/domain/aggregates";
import {
  PublishedRecordId,
  PublishedRecordIdProps,
} from "src/modules/annotations/domain/value-objects";
import { ok, Result } from "src/shared/core/Result";
import { UseCaseError } from "src/shared/core/UseCaseError";

export class FakeAnnotationPublisher implements IAnnotationPublisher {
  private publishedRecords: Map<PublishedRecordIdProps, Annotation> = new Map();

  async publish(
    annotation: Annotation
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    const annotationId = annotation.annotationId.getStringValue();
    // Simulate generating an AT URI based on DID and collection/rkey
    const fakeUri = `at://fake-did/app.annos.annotation/${annotationId}`;
    const fakeCid = `fake-cid-${annotationId}`;
    const publishedRecordId = PublishedRecordId.create({
      uri: fakeUri,
      cid: fakeCid,
    });

    // Store the published annotation for inspection if needed
    this.publishedRecords.set(publishedRecordId.getValue(), annotation);

    console.log(
      `[FakeAnnotationPublisher] Published annotation ${annotationId} to ${fakeUri}`
    );
    return ok(publishedRecordId);
  }

  async unpublish(
    recordId: PublishedRecordId
  ): Promise<Result<void, UseCaseError>> {
    const uri = recordId.getValue();
    if (this.publishedRecords.has(uri)) {
      this.publishedRecords.delete(uri);
      console.log(`[FakeAnnotationPublisher] Unpublished record ${uri}`);
      return ok(undefined); // Use ok(undefined) for void success
    } else {
      console.warn(
        `[FakeAnnotationPublisher] Record not found for unpublishing: ${uri}`
      );
      // Depending on requirements, you might return an error here
      // For a simple fake, we can still return success
      return ok(undefined);
    }
  }
}
