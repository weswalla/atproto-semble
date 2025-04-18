import { Annotation } from '../../domain/aggregates/Annotation'
import { IAnnotationRepository } from '../repositories/IAnnotationRepository'
import { IAnnotationFieldRepository } from '../repositories/IAnnotationFieldRepository'
// Import DTOs for input/output if needed
// Import Value Objects

// Placeholder for CreateAnnotationUseCase
export class CreateAnnotationUseCase {
  constructor(
    private annotationRepo: IAnnotationRepository,
    private fieldRepo: IAnnotationFieldRepository, // Needed for validation
  ) {}

  async execute(input: /* Define Input DTO */ any): Promise</* Output DTO or Annotation ID */ any> {
    // 1. Validate input DTO
    // 2. Fetch the referenced AnnotationField using fieldRepo
    // 3. Validate the input.value against the AnnotationField.definition
    //    - e.g., check if SingleSelectValue.option is in FieldDefinition.options
    //    - e.g., check if RatingValue.rating <= FieldDefinition.numberOfStars
    // 4. Create Value Objects (URI, StrongRef, AnnotationValue, etc.) from input
    // 5. Create Annotation aggregate instance using Annotation.create() factory
    // 6. Persist using annotationRepo.save(annotation)
    // 7. Return result (e.g., annotation ID or Output DTO)

    console.log('Executing CreateAnnotationUseCase with input:', input)
    // Placeholder implementation
    // const field = await this.fieldRepo.findById(input.fieldRef.uri);
    // if (!field) throw new Error('AnnotationField not found');
    // ... validation logic ...
    // const annotation = Annotation.create({...});
    // await this.annotationRepo.save(annotation);
    // return annotation.id;
    throw new Error('Not implemented')
  }
}
