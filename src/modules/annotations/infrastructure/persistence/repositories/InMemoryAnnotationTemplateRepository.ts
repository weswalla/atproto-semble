import { IAnnotationTemplateRepository } from 'src/modules/annotations/application/repositories';
import { AnnotationTemplate } from 'src/modules/annotations/domain/aggregates';
import {
  AnnotationTemplateId,
  PublishedRecordId,
} from 'src/modules/annotations/domain/value-objects';

export class InMemoryAnnotationTemplateRepository
  implements IAnnotationTemplateRepository
{
  // Store templates using the string representation of AnnotationTemplateId
  private templates: Map<string, AnnotationTemplate> = new Map();

  // Simple clone function using structuredClone (requires Node.js >= 17 or polyfill)
  // Fallback to basic spread if structuredClone is unavailable, but be aware of limitations.
  private clone(template: AnnotationTemplate): AnnotationTemplate {
    if (typeof structuredClone === 'function') {
      return structuredClone(template);
    } else {
      // Basic spread - WARNING: May not deeply clone nested objects/classes correctly.
      // Consider a more robust cloning method if needed.
      console.warn("structuredClone not available, using basic spread for cloning. Nested objects might not be fully cloned.");
      const props = { ...template.props };
      // Re-create to ensure prototype chain is correct, though nested objects are still shallow copied
      const recreatedResult = AnnotationTemplate.create(props, template.id);
      if (recreatedResult.isErr()) {
          // This should ideally not happen if cloning valid props
          throw new Error(`Cloning failed during re-creation: ${recreatedResult.error.message}`);
      }
      return recreatedResult.value;
    }
  }

  async findById(id: AnnotationTemplateId): Promise<AnnotationTemplate | null> {
    const template = this.templates.get(id.getStringValue());
    return template ? this.clone(template) : null;
  }

  async findByPublishedRecordId(
    recordId: PublishedRecordId,
  ): Promise<AnnotationTemplate | null> {
    const recordIdValue = recordId.getValue();
    for (const template of this.templates.values()) {
      if (template.publishedRecordId?.getValue() === recordIdValue) {
        return this.clone(template);
      }
    }
    return null;
  }

  async findByName(name: string): Promise<AnnotationTemplate | null> {
    for (const template of this.templates.values()) {
      // Access the value of the AnnotationTemplateName value object
      if (template.name.value === name) {
        return this.clone(template);
      }
    }
    return null;
  }

  async save(template: AnnotationTemplate): Promise<void> {
    // Store a clone to prevent mutation of the stored object
    const templateToStore = this.clone(template);
    this.templates.set(templateToStore.templateId.getStringValue(), templateToStore);
    // Note: This minimal version does NOT save associated AnnotationFields.
    // That logic would need to be added here (by injecting IAnnotationFieldRepository)
    // or handled externally (e.g., in the use case).
  }

  async delete(id: AnnotationTemplateId): Promise<void> {
    this.templates.delete(id.getStringValue());
    // Note: This minimal version does NOT delete associated AnnotationFields.
  }

  // Helper to clear the store between tests
  public clear(): void {
    this.templates.clear();
  }

  // Helper to get the raw stored template for assertions (use carefully)
  public getStoredTemplate(
    id: AnnotationTemplateId,
  ): AnnotationTemplate | undefined {
    // Returns the actual stored instance, not a clone
    return this.templates.get(id.getStringValue());
  }
}
