import { IAnnotationRepository } from "src/modules/annotations/application/repositories/IAnnotationRepository";
import { Annotation } from "src/modules/annotations/domain/aggregates/Annotation";
import { TID } from "src/atproto/domain/value-objects/TID";
import { URI } from "src/modules/annotations/domain/value-objects/URI";

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

  async findById(id: TID): Promise<Annotation | null> {
    const annotation = this.annotations.get(id.toString());
    return annotation ? this.clone(annotation) : null;
  }

  async findByUri(uri: string): Promise<Annotation | null> {
    const annotation = this.annotationsByUri.get(uri);
    return annotation ? this.clone(annotation) : null;
  }

  async findByUrl(url: URI): Promise<Annotation[]> {
    const annotations = this.annotationsByUrl.get(url.value) || [];
    return annotations.map((annotation) => this.clone(annotation));
  }

  async save(annotation: Annotation): Promise<void> {
    // Store a clone to prevent mutation of the stored object
    const annotationToStore = this.clone(annotation);
    const idString = annotationToStore.annotationId.getStringValue();

    // Store by ID
    this.annotations.set(idString, annotationToStore);

    // Store by URI if available
    if (annotationToStore.publishedRecordId) {
      const uri = annotationToStore.publishedRecordId.getValue();
      this.annotationsByUri.set(uri, annotationToStore);
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

  async delete(id: TID): Promise<void> {
    const annotation = this.annotations.get(id.toString());
    if (!annotation) return;

    // Remove from ID index
    this.annotations.delete(id.toString());

    // Remove from URI index if available
    if (annotation.publishedRecordId) {
      this.annotationsByUri.delete(annotation.publishedRecordId.getValue());
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
