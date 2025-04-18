import { IAnnotationRepository } from '../repositories/IAnnotationRepository'
import { URI } from '../../domain/value-objects/URI'
// Import DTOs

// Placeholder for ListAnnotationsForResourceUseCase
export class ListAnnotationsForResourceUseCase {
  constructor(private annotationRepo: IAnnotationRepository) {}

  async execute(resourceUri: URI): Promise</* Annotation[] or Output DTO[] */ any[]> {
    // 1. Fetch annotations using annotationRepo.findByUrl(resourceUri)
    // 2. Map to DTOs if needed
    // 3. Return results

    console.log('Executing ListAnnotationsForResourceUseCase with URI:', resourceUri.toString())
    // Placeholder implementation
    // const annotations = await this.annotationRepo.findByUrl(resourceUri);
    // return annotations; // Or map to DTOs
    throw new Error('Not implemented')
  }
}
