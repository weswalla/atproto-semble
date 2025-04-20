import { AnnotationField } from "../../domain/aggregates/AnnotationField";
import { AnnotationFieldId } from "../../domain/value-objects/AnnotationFieldId";
import { PublishedRecordId } from "../../domain/value-objects"; // Import PublishedRecordId

// Interface for AnnotationField Repository
export interface IAnnotationFieldRepository {
  findById(id: AnnotationFieldId): Promise<AnnotationField | null>;
  findByPublishedRecordId(
    recordId: PublishedRecordId
  ): Promise<AnnotationField | null>; // Find by AT URI (PublishedRecordId)
  findByName(name: string): Promise<AnnotationField | null>; // Example query
  save(field: AnnotationField): Promise<void>;
  delete(id: AnnotationFieldId): Promise<void>;
  // Add other query methods as needed
}
