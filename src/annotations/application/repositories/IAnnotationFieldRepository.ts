import { AnnotationField } from '../../domain/aggregates/AnnotationField'
import { TID } from '../../../atproto/domain/value-objects/TID'

// Placeholder Interface for AnnotationField Repository
export interface IAnnotationFieldRepository {
  findById(id: TID): Promise<AnnotationField | null>
  findByUri(uri: string): Promise<AnnotationField | null> // Find by AT URI
  findByName(name: string): Promise<AnnotationField | null> // Example query
  save(field: AnnotationField): Promise<void>
  delete(id: TID): Promise<void>
  // Add other query methods as needed
}
