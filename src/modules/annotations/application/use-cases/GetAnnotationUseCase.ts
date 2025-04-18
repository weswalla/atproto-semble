import { IAnnotationRepository } from "../repositories/IAnnotationRepository";
import { TID } from "../../../../atproto/domain/value-objects/TID";
// Import DTOs for output if needed

// Placeholder for GetAnnotationUseCase
export class GetAnnotationUseCase {
  constructor(private annotationRepo: IAnnotationRepository) {}

  async execute(id: TID): Promise</* Annotation or Output DTO */ any> {
    // 1. Fetch annotation using annotationRepo.findById(id)
    // 2. Map domain object to Output DTO if necessary
    // 3. Return result

    console.log("Executing GetAnnotationUseCase with id:", id.toString());
    // Placeholder implementation
    // const annotation = await this.annotationRepo.findById(id);
    // if (!annotation) throw new Error('Annotation not found');
    // return annotation; // Or map to DTO
    throw new Error("Not implemented");
  }
}
