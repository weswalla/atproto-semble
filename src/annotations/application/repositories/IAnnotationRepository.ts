import { Annotation } from '../../domain/aggregates/Annotation'
import { TID } from '../../../atproto/domain/value-objects/TID'
import { URI } from '../../domain/value-objects/URI'

// Placeholder Interface for Annotation Repository
export interface IAnnotationRepository {
  findById(id: TID): Promise<Annotation | null>
  findByUri(uri: string): Promise<Annotation | null> // Find by AT URI
  findByUrl(url: URI): Promise<Annotation[]> // Find by annotated resource URL
  save(annotation: Annotation): Promise<void>
  delete(id: TID): Promise<void>
  // Add other query methods as needed
}
