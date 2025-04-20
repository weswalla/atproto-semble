import { UniqueEntityID } from "../../../../shared/domain/UniqueEntityID";
import { Result } from "../../../../shared/core/Result";
import { AnnotationTemplate } from "./AnnotationTemplate";
import {
  AnnotationFieldId,
  AnnotationTemplateDescription,
  AnnotationTemplateField,
  AnnotationTemplateName,
  CuratorId,
  PublishedRecordId,
} from "../value-objects"; // Adjust imports as needed

// Mock Value Objects
const mockCuratorId = CuratorId.create("did:example:curator").getValue();
const mockName = AnnotationTemplateName.create("Test Template Name").getValue();
const mockDescription = AnnotationTemplateDescription.create(
  "Test Template Description"
).getValue();
const mockPublishedRecordId = PublishedRecordId.create(
  "at://did:example:repo/app.annos.annotationTemplate/template123"
);

// Mock AnnotationTemplateFields
const fieldId1 = AnnotationFieldId.create(
  new UniqueEntityID("field-1")
).getValue();
const mockField1 = AnnotationTemplateField.create({
  annotationFieldId: fieldId1,
  required: true,
}).getValue();

const fieldId2 = AnnotationFieldId.create(
  new UniqueEntityID("field-2")
).getValue();
const mockField2 = AnnotationTemplateField.create({
  annotationFieldId: fieldId2,
  required: false,
}).getValue();

// --- Test Suite ---
describe("AnnotationTemplate Aggregate", () => {
  // --- Base Props for successful creation ---
  const baseProps = {
    curatorId: mockCuratorId,
    name: mockName,
    description: mockDescription,
    annotationFields: [mockField1, mockField2],
  };

  // --- Create Method Tests ---
  describe("create", () => {
    it("should create a new AnnotationTemplate successfully with valid props", () => {
      const props = {
        curatorId: mockCuratorId,
        name: mockName,
        description: mockDescription,
        annotationFields: [mockField1, mockField2],
      };
      const result = AnnotationTemplate.create(props);

      expect(result.isSuccess).toBe(true);
      const template = result.getValue();
      expect(template).toBeInstanceOf(AnnotationTemplate);
      expect(template.id).toBeInstanceOf(UniqueEntityID);
      expect(template.curatorId).toEqual(mockCuratorId);
      expect(template.name).toEqual(mockName);
      expect(template.description).toEqual(mockDescription);
      expect(template.annotationFields).toEqual([mockField1, mockField2]);
      expect(template.createdAt).toBeInstanceOf(Date);
      expect(template.publishedRecordId).toBeUndefined(); // Default
    });

    it("should fail if a required prop is missing (e.g., name)", () => {
      // Create props object missing the 'name' property
      const propsWithoutName = {
        curatorId: mockCuratorId,
        description: mockDescription,
        annotationFields: [mockField1],
      };
      // We need to cast to 'any' here because TS knows 'name' is missing,
      // but we are testing the runtime validation within AnnotationTemplate.create
      const result = AnnotationTemplate.create(
        propsWithoutName as AnnotationTemplateProps
      );

      expect(result.isFailure).toBe(true);
      // Check that the error message mentions the missing property
      expect(result.getErrorValue()).toContain("name");
    });

    it("should fail if annotationFields array is empty", () => {
      const props = {
        curatorId: mockCuratorId,
        name: mockName,
        description: mockDescription,
        annotationFields: [], // Empty array
      };
      const result = AnnotationTemplate.create(props);

      expect(result.isFailure).toBe(true);
      expect(result.getErrorValue()).toContain(
        "AnnotationTemplate must include at least one field"
      );
    });
  });

  // --- Instance Method Tests ---
  // Helper to create a valid template instance for method testing
  const createValidTemplate = (): AnnotationTemplate => {
    const result = AnnotationTemplate.create(baseProps);
    if (result.isFailure) {
      throw new Error(
        `Failed to create valid template for testing: ${result.getErrorValue()}`
      );
    }
    return result.getValue();
  };

  describe("updatePublishedRecordId", () => {
    it("should update the publishedRecordId", () => {
      const template = createValidTemplate();
      expect(template.publishedRecordId).toBeUndefined(); // Check initial state

      const newRecordId = PublishedRecordId.create(
        "at://did:example:repo/app.annos.annotationTemplate/newTemplate456"
      );
      // updatePublishedRecordId doesn't return a Result, it's a void method
      template.updatePublishedRecordId(newRecordId);

      expect(template.publishedRecordId).toEqual(newRecordId);
    });
  });

  describe("addField", () => {
    it("should add a new field successfully", () => {
      const template = createValidTemplate();
      const initialLength = template.annotationFields.length;
      const newFieldId = AnnotationFieldId.create(
        new UniqueEntityID("new-field")
      ).getValue();
      const newField = AnnotationTemplateField.create({
        annotationFieldId: newFieldId,
        required: false,
      }).getValue();

      const result = template.addField(newField);

      expect(result.isSuccess).toBe(true);
      expect(template.annotationFields).toHaveLength(initialLength + 1);
      expect(template.annotationFields).toContain(newField);
    });

    it("should fail to add a field that already exists", () => {
      const template = createValidTemplate();
      const initialLength = template.annotationFields.length;
      const existingField = template.annotationFields[0]; // Get an existing field

      const result = template.addField(existingField); // Try to add it again

      expect(result.isFailure).toBe(true);
      expect(template.annotationFields).toHaveLength(initialLength); // Length should not change
      expect(result.getErrorValue()).toContain("Field already exists");
    });
  });

  describe("removeField", () => {
    it("should remove an existing field successfully", () => {
      const template = createValidTemplate(); // Has mockField1 and mockField2
      expect(template.annotationFields).toHaveLength(2);

      const result = template.removeField(fieldId1.getValue()); // Remove mockField1 by its ID

      expect(result.isSuccess).toBe(true);
      expect(template.annotationFields).toHaveLength(1);
      expect(template.annotationFields).not.toContain(mockField1);
      expect(template.annotationFields).toContain(mockField2); // Ensure the other field is still there
    });

    it("should fail to remove the last field", () => {
      // Create a template with only one field first
      const singleFieldProps = { ...baseProps, annotationFields: [mockField1] };
      const singleFieldTemplateResult =
        AnnotationTemplate.create(singleFieldProps);
      expect(singleFieldTemplateResult.isSuccess).toBe(true); // Ensure creation succeeded
      const singleFieldTemplate = singleFieldTemplateResult.getValue();

      expect(singleFieldTemplate.annotationFields).toHaveLength(1);
      const result = singleFieldTemplate.removeField(fieldId1.getValue()); // Try to remove the only field

      expect(result.isFailure).toBe(true);
      expect(singleFieldTemplate.annotationFields).toHaveLength(1); // Length should not change
      expect(result.getErrorValue()).toContain("Cannot remove the last field");
    });
  });

  describe("updateName", () => {
    it("should update the template name", () => {
      const template = createValidTemplate();
      const newNameResult = AnnotationTemplateName.create(
        "Updated Template Name"
      );
      expect(newNameResult.isSuccess).toBe(true); // Ensure new name is valid
      const newName = newNameResult.getValue();

      const result = template.updateName(newName);

      expect(result.isSuccess).toBe(true);
      expect(template.name).toEqual(newName);
    });
  });

  describe("updateDescription", () => {
    it("should update the template description", () => {
      const template = createValidTemplate();
      const newDescriptionResult = AnnotationTemplateDescription.create(
        "Updated Template Description"
      );
      expect(newDescriptionResult.isSuccess).toBe(true); // Ensure new description is valid
      const newDescription = newDescriptionResult.getValue();

      const result = template.updateDescription(newDescription);

      expect(result.isSuccess).toBe(true);
      expect(template.description).toEqual(newDescription);
    });
  });
});
