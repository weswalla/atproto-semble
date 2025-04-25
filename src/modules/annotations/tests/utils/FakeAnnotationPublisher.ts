import { IAnnotationPublisher } from "../../application/ports/IAnnotationPublisher";
import { Annotation } from "../../domain/aggregates/Annotation";
import { PublishedRecordId } from "../../domain/value-objects/PublishedRecordId";
import { Result, ok } from "../../../../shared/core/Result";
import { UseCaseError } from "../../../../shared/core/UseCaseError";

export class FakeAnnotationPublisher implements IAnnotationPublisher {
  private publishedRecords: Map<string, Annotation> = new Map();

  async publish(
    annotation: Annotation
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    const annotationId = annotation.annotationId.getStringValue();
    // Simulate generating an AT URI based on DID and collection/rkey
    const fakeUri = `at://fake-did/app.annos.annotation/${annotationId}`;
    const publishedRecordId = PublishedRecordId.create(fakeUri);

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

  // Helper method for tests to check published state
  getPublishedRecord(uri: string): Annotation | undefined {
    return this.publishedRecords.get(uri);
  }

  clearPublishedRecords(): void {
    this.publishedRecords.clear();
  }
}
