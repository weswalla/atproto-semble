import { Annotation } from "../../domain/aggregates/Annotation";
import { AnnotationId, PublishedRecordId } from "../../domain/value-objects";
import { URI } from "../../domain/value-objects/URI";

// Interface for Annotation Repository
export interface IAnnotationRepository {
  findById(id: AnnotationId): Promise<Annotation | null>;
  findByPublishedRecordId(
    recordId: PublishedRecordId
  ): Promise<Annotation | null>; // Find by AT URI (PublishedRecordId)
  findByUrl(url: URI): Promise<Annotation[]>; // Find by annotated resource URL
  save(annotation: Annotation): Promise<void>;
  delete(id: AnnotationId): Promise<void>;
  // Add other query methods as needed
}
