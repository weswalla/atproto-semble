import { StrongRef } from "../../../../atproto/domain/value-objects/StrongRef";

// Placeholder for TemplateField Value Object
export class TemplateField {
  readonly $type = "app.annos.annotationTemplate#annotationFieldRef"; // Match lexicon def
  readonly fieldRef: StrongRef; // Reference to AnnotationField
  readonly required: boolean;

  constructor(fieldRef: StrongRef, required: boolean = false) {
    this.fieldRef = fieldRef;
    this.required = required;
    // TODO: Add validation if needed
  }
}
