import { IAnnotationFieldRepository } from '../repositories/IAnnotationFieldRepository'
import { TID } from '../../../atproto/domain/value-objects/TID'
// Import DTOs

// Placeholder for GetAnnotationFieldUseCase
export class GetAnnotationFieldUseCase {
  constructor(private fieldRepo: IAnnotationFieldRepository) {}

  async execute(id: TID): Promise</* AnnotationField or Output DTO */ any> {
    // 1. Fetch field using fieldRepo.findById(id)
    // 2. Map to DTO if needed
    // 3. Return result

    console.log('Executing GetAnnotationFieldUseCase with id:', id.toString())
    // Placeholder implementation
    // const field = await this.fieldRepo.findById(id);
    // if (!field) throw new Error('AnnotationField not found');
    // return field; // Or map to DTO
    throw new Error('Not implemented')
  }
}
