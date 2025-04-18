import { IAnnotationTemplateRepository } from "../repositories/IAnnotationTemplateRepository";
import { TID } from "../../../../atproto/domain/value-objects/TID";
// Import DTOs

// Placeholder for GetAnnotationTemplateUseCase
export class GetAnnotationTemplateUseCase {
  constructor(private templateRepo: IAnnotationTemplateRepository) {}

  async execute(id: TID): Promise</* AnnotationTemplate or Output DTO */ any> {
    // 1. Fetch template using templateRepo.findById(id)
    // 2. Map to DTO if needed
    // 3. Return result

    console.log(
      "Executing GetAnnotationTemplateUseCase with id:",
      id.toString()
    );
    // Placeholder implementation
    // const template = await this.templateRepo.findById(id);
    // if (!template) throw new Error('AnnotationTemplate not found');
    // return template; // Or map to DTO
    throw new Error("Not implemented");
  }
}
