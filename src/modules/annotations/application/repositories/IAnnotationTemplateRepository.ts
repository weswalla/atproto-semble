import { AnnotationTemplate } from '../../domain/aggregates/AnnotationTemplate';
import {
  AnnotationTemplateId,
  PublishedRecordId,
} from '../../domain/value-objects'; // Use domain IDs

// Interface for AnnotationTemplate Repository
export interface IAnnotationTemplateRepository {
  findById(id: AnnotationTemplateId): Promise<AnnotationTemplate | null>;
  findByPublishedRecordId(
    recordId: PublishedRecordId,
  ): Promise<AnnotationTemplate | null>; // Find by AT URI (PublishedRecordId)
  findByName(name: string): Promise<AnnotationTemplate | null>; // Example query
  save(template: AnnotationTemplate): Promise<void>;
  delete(id: AnnotationTemplateId): Promise<void>;
  // Add other query methods as needed
}
