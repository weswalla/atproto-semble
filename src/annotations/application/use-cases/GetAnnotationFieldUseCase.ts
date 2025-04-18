import { IAnnotationFieldRepository } from '../repositories/IAnnotationFieldRepository'
import { TID } from '../../../atproto/domain/value-objects/TID'
import { AnnotationFieldOutputDTO } from '../dtos/AnnotationFieldDTO'
import { AnnotationFieldMapper } from '../../infrastructure/persistence/drizzle/mappers/AnnotationFieldMapper' // Adjust path if needed
import { AnnotationField } from '../../domain/aggregates/AnnotationField' // Import Aggregate

export class GetAnnotationFieldUseCase {
  constructor(private fieldRepo: IAnnotationFieldRepository) {}

  async execute(id: TID): Promise<AnnotationFieldOutputDTO | null> {
    // 1. Fetch field using fieldRepo.findById(id)
    const field: AnnotationField | null = await this.fieldRepo.findById(id)

    // 2. Handle not found case
    if (!field) {
      // Decide on behavior: return null, throw specific error, etc.
      // Returning null aligns with repository behavior often.
      return null
    }

    // 3. Map to DTO
    // Assuming a mapper exists. If not, manual mapping is needed.
    // TODO: Implement or verify AnnotationFieldMapper exists and works
    return AnnotationFieldMapper.toDTO(field)
  }
}
