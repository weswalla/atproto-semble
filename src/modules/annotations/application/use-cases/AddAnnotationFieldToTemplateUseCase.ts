import { IAnnotationTemplateRepository } from "../repositories/IAnnotationTemplateRepository";
import { IAnnotationFieldRepository } from "../repositories/IAnnotationFieldRepository";
import { TID } from "../../../../atproto/domain/value-objects/TID";
import { StrongRef } from "../../../../atproto/domain/value-objects/StrongRef";
// Import DTOs

// Placeholder for AddAnnotationFieldToTemplateUseCase
export class AddAnnotationFieldToTemplateUseCase {
  constructor(
    private templateRepo: IAnnotationTemplateRepository,
    private fieldRepo: IAnnotationFieldRepository // To validate field exists
  ) {}

  async execute(input: {
    templateId: TID;
    fieldRef: StrongRef;
    required?: boolean;
  }): Promise<void> {
    // 1. Validate input
    // 2. Fetch the AnnotationTemplate using templateRepo.findById(templateId)
    // 3. Fetch the AnnotationField using fieldRepo.findByUri(fieldRef.uri) to ensure it exists
    // 4. Create a new TemplateField value object
    // 5. Call template.addField(templateField) domain method
    // 6. Persist the updated template using templateRepo.save(template)

    console.log(
      "Executing AddAnnotationFieldToTemplateUseCase with input:",
      input
    );
    // Placeholder implementation
    // const template = await this.templateRepo.findById(input.templateId);
    // if (!template) throw new Error('Template not found');
    // const field = await this.fieldRepo.findByUri(input.fieldRef.uri);
    // if (!field) throw new Error('Field not found');
    // const templateField = new TemplateField(input.fieldRef, input.required);
    // template.addField(templateField); // Assuming this method handles duplicates etc.
    // await this.templateRepo.save(template);
    throw new Error("Not implemented");
  }
}
