import { IAnnotationFieldPublisher } from '../../application/ports/IAnnotationFieldPublisher';
import { AnnotationField } from '../../domain/aggregates/AnnotationField';
import { PublishedRecordId } from '../../domain/value-objects/PublishedRecordId';
import { Result, ok } from '../../../../shared/core/Result';
import { UseCaseError } from '../../../../shared/core/UseCaseError';

export class FakeAnnotationFieldPublisher implements IAnnotationFieldPublisher {
  private publishedRecords: Map<string, AnnotationField> = new Map();

  async publish(
    field: AnnotationField,
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    const fieldId = field.fieldId.getStringValue();
    // Simulate generating an AT URI based on DID and collection/rkey
    const fakeUri = `at://fake-did/app.annos.field/${fieldId}`;
    const publishedRecordId = PublishedRecordId.create(fakeUri);

    // Store the published field for inspection if needed
    this.publishedRecords.set(publishedRecordId.getValue(), field);

    console.log(
      `[FakeAnnotationFieldPublisher] Published field ${fieldId} to ${fakeUri}`,
    );
    return ok(publishedRecordId);
  }

  async unpublish(
    recordId: PublishedRecordId,
  ): Promise<Result<void, UseCaseError>> {
    const uri = recordId.getValue();
    if (this.publishedRecords.has(uri)) {
      this.publishedRecords.delete(uri);
      console.log(`[FakeAnnotationFieldPublisher] Unpublished record ${uri}`);
      return ok(undefined); // Use ok(undefined) for void success
    } else {
      console.warn(
        `[FakeAnnotationFieldPublisher] Record not found for unpublishing: ${uri}`,
      );
      // Depending on requirements, you might return an error here
      // For a simple fake, we can still return success
      return ok(undefined);
    }
  }

  // Helper method for tests to check published state
  getPublishedRecord(uri: string): AnnotationField | undefined {
    return this.publishedRecords.get(uri);
  }

  clearPublishedRecords(): void {
    this.publishedRecords.clear();
  }
}
