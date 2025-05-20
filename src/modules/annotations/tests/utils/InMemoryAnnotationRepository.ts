import { IAnnotationRepository } from "src/modules/annotations/application/repositories/IAnnotationRepository";
import { Annotation } from "src/modules/annotations/domain/aggregates/Annotation";
import { URI } from "src/modules/annotations/domain/value-objects/URI";
import {
  AnnotationId,
  CuratorId,
  PublishedRecordId,
} from "../../domain/value-objects";

export class InMemoryAnnotationRepository implements IAnnotationRepository {
  // Store annotations using the string representation of TID
  private annotations: Map<string, Annotation> = new Map();
  // Index by URI for faster lookups
  private annotationsByUri: Map<string, Annotation> = new Map();
  // Index by URL for faster lookups (multiple annotations can have the same URL)
  private annotationsByUrl: Map<string, Annotation[]> = new Map();

  // Simple clone function to prevent mutation of stored objects
  private clone(annotation: Annotation): Annotation {
    const props = { ...annotation.props };
    // Re-create to ensure prototype chain is correct
    const recreatedResult = Annotation.create(props, annotation.id);
    if (recreatedResult.isErr()) {
      throw new Error(
        `Cloning failed during re-creation: ${recreatedResult.error}`
      );
    }
    return recreatedResult.value;
  }

  async findById(id: AnnotationId): Promise<Annotation | null> {
    const annotation = this.annotations.get(id.getStringValue());
    return annotation ? this.clone(annotation) : null;
  }

  async findByPublishedRecordId(
    publishedRecordId: PublishedRecordId
  ): Promise<Annotation | null> {
    const annotation = this.annotationsByUri.get(
      publishedRecordId.uri + publishedRecordId.cid
    );
    return annotation ? this.clone(annotation) : null;
  }

  async findByUrl(url: URI): Promise<Annotation[]> {
    const annotations = this.annotationsByUrl.get(url.value) || [];
    return annotations.map((annotation) => this.clone(annotation));
  }

  async findByCuratorId(curatorId: CuratorId): Promise<Annotation[]> {
    const result: Annotation[] = [];
    for (const annotation of this.annotations.values()) {
      if (annotation.curatorId && annotation.curatorId.equals(curatorId)) {
        result.push(this.clone(annotation));
      }
    }
    return result;
  }

  async save(annotation: Annotation): Promise<void> {
    // Store a clone to prevent mutation of the stored object
    const annotationToStore = this.clone(annotation);
    const idString = annotationToStore.annotationId.getStringValue();

    // Store by ID
    this.annotations.set(idString, annotationToStore);

    // Store by URI if available
    if (annotationToStore.publishedRecordId) {
      const publishedRecordId = annotationToStore.publishedRecordId;
      this.annotationsByUri.set(
        publishedRecordId.uri + publishedRecordId.cid,
        annotationToStore
      );
    }

    // Store by URL
    const urlString = annotationToStore.url.value;
    const existingForUrl = this.annotationsByUrl.get(urlString) || [];

    // Remove any existing annotation with the same ID
    const filteredExisting = existingForUrl.filter(
      (a) => a.annotationId.getStringValue() !== idString
    );

    // Add the new/updated annotation
    filteredExisting.push(annotationToStore);
    this.annotationsByUrl.set(urlString, filteredExisting);
  }

  async delete(id: AnnotationId): Promise<void> {
    const annotation = this.annotations.get(id.getStringValue());
    if (!annotation) return;

    // Remove from ID index
    this.annotations.delete(id.toString());
    const recordKey = annotation.publishedRecordId
      ? annotation.publishedRecordId?.uri + annotation.publishedRecordId?.cid
      : undefined;

    // Remove from URI index if available
    if (annotation.publishedRecordId && recordKey) {
      this.annotationsByUri.delete(recordKey);
    }

    // Remove from URL index
    const urlString = annotation.url.value;
    const existingForUrl = this.annotationsByUrl.get(urlString) || [];
    const filteredExisting = existingForUrl.filter(
      (a) => a.annotationId.getStringValue() !== id.toString()
    );

    if (filteredExisting.length > 0) {
      this.annotationsByUrl.set(urlString, filteredExisting);
    } else {
      this.annotationsByUrl.delete(urlString);
    }
  }

  // Helper to clear the store between tests
  public clear(): void {
    this.annotations.clear();
    this.annotationsByUri.clear();
    this.annotationsByUrl.clear();
  }

  // Helper to get the raw stored annotation for assertions (use carefully)
  public getStoredAnnotation(id: string): Annotation | undefined {
    // Returns the actual stored instance, not a clone
    return this.annotations.get(id);
  }
}
