import { AnnotationTemplate } from "../../domain/aggregates/AnnotationTemplate";
import { IAnnotationTemplateRepository } from "../repositories/IAnnotationTemplateRepository";
import { IAnnotationFieldRepository } from "../repositories/IAnnotationFieldRepository"; // To validate field refs
import { TemplateField } from "../../domain/value-objects/TemplateField";
import { StrongRef } from "../../../../atproto/domain/value-objects/StrongRef";
// Import DTOs

// Placeholder for CreateAnnotationTemplateUseCase
export class CreateAnnotationTemplateUseCase {
  constructor(
    private templateRepo: IAnnotationTemplateRepository,
    private fieldRepo: IAnnotationFieldRepository // To validate field refs exist
  ) {}

  async execute(
    input: /* Input DTO */ any
  ): Promise</* Template ID or Output DTO */ any> {
    // 1. Validate input DTO
    // 2. Validate that all referenced annotation fields exist using fieldRepo
    // 3. Create TemplateField value objects from input.annotationFields
    // 4. Create AnnotationTemplate aggregate using AnnotationTemplate.create()
    // 5. Persist using templateRepo.save(template)
    // 6. Return result

    console.log("Executing CreateAnnotationTemplateUseCase with input:", input);
    // Placeholder implementation
    // const fieldRefs = input.annotationFields.map(f => new StrongRef(f.ref.cid, f.ref.uri));
    // // Optional: Validate fields exist
    // await Promise.all(fieldRefs.map(ref => this.fieldRepo.findByUri(ref.uri))); // Throws if not found
    // const templateFields = input.annotationFields.map(f => new TemplateField(new StrongRef(f.ref.cid, f.ref.uri), f.required));
    // const template = AnnotationTemplate.create({ name: input.name, ..., annotationFields: templateFields });
    // await this.templateRepo.save(template);
    // return template.id;
    throw new Error("Not implemented");
  }
}
