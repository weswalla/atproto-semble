import { AnnotationTemplate } from "../../domain/aggregates/AnnotationTemplate";
import { TID } from "../../../../atproto/domain/value-objects/TID";

// Placeholder Interface for AnnotationTemplate Repository
export interface IAnnotationTemplateRepository {
  findById(id: TID): Promise<AnnotationTemplate | null>;
  findByUri(uri: string): Promise<AnnotationTemplate | null>; // Find by AT URI
  findByName(name: string): Promise<AnnotationTemplate | null>; // Example query
  save(template: AnnotationTemplate): Promise<void>;
  delete(id: TID): Promise<void>;
  // Add other query methods as needed
}
