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

const fieldId3 = AnnotationFieldId.create(
  new UniqueEntityID("field-3")
).getValue();
const mockField3 = AnnotationTemplateField.create({
  annotationFieldId: fieldId3,
  required: true,
}).getValue();

describe("AnnotationTemplate Aggregate", () => {
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
      expect(template.publishedRecordId).toBeUndefined();
    });

    it("should create an AnnotationTemplate with a specific ID", () => {
      const specificId = new UniqueEntityID("specific-template-id");
      const props = {
        curatorId: mockCuratorId,
        name: mockName,
        description: mockDescription,
        annotationFields: [mockField1],
      };
      const result = AnnotationTemplate.create(props, specificId);

      expect(result.isSuccess).toBe(true);
      const template = result.getValue();
      expect(template.id.equals(specificId)).toBe(true);
      expect(template.templateId.getValue().equals(specificId)).toBe(true); // Check getter too
    });

    it("should set createdAt timestamp on creation", () => {
      const props = {
        curatorId: mockCuratorId,
        name: mockName,
        description: mockDescription,
        annotationFields: [mockField1],
      };
      const result = AnnotationTemplate.create(props);
      const template = result.getValue();
      const now = new Date();
      expect(template.createdAt.getTime()).toBeCloseTo(now.getTime(), -2); // Within ~100ms
    });

    it("should accept an optional publishedRecordId on creation", () => {
      const props = {
        curatorId: mockCuratorId,
        name: mockName,
        description: mockDescription,
        annotationFields: [mockField1],
        publishedRecordId: mockPublishedRecordId,
      };
      const result = AnnotationTemplate.create(props);

      expect(result.isSuccess).toBe(true);
      const template = result.getValue();
      expect(template.publishedRecordId).toEqual(mockPublishedRecordId);
    });

    it("should fail if required props are missing (e.g., name)", () => {
      const props = {
        curatorId: mockCuratorId,
        // name: mockName, // Missing name
        description: mockDescription,
        annotationFields: [mockField1],
      };
      const result = AnnotationTemplate.create(<any>props);

      expect(result.isFailure).toBe(true);
      expect(result.getErrorValue()).toContain("name");
    });

    it("should fail if required props are missing (e.g., description)", () => {
      const props = {
        curatorId: mockCuratorId,
        name: mockName,
        // description: mockDescription, // Missing description
        annotationFields: [mockField1],
      };
      const result = AnnotationTemplate.create(<any>props);

      expect(result.isFailure).toBe(true);
      expect(result.getErrorValue()).toContain("description");
    });

    it("should fail if required props are missing (e.g., annotationFields)", () => {
      const props = {
        curatorId: mockCuratorId,
        name: mockName,
        description: mockDescription,
        // annotationFields: [mockField1], // Missing fields
      };
      const result = AnnotationTemplate.create(<any>props);

      expect(result.isFailure).toBe(true);
      expect(result.getErrorValue()).toContain("annotationFields");
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

  describe("getters", () => {
    let template: AnnotationTemplate;
    const specificId = new UniqueEntityID("getter-template-id");
    const createdAt = new Date("2024-02-01T10:00:00Z");

    beforeAll(() => {
      const props = {
        curatorId: mockCuratorId,
        name: mockName,
        description: mockDescription,
        annotationFields: [mockField1, mockField2],
        publishedRecordId: mockPublishedRecordId,
        createdAt: createdAt,
      };
      template = AnnotationTemplate.create(props, specificId).getValue();
    });

    it("should return the correct templateId", () => {
      expect(template.templateId.getValue().equals(specificId)).toBe(true);
    });

    it("should return the correct curatorId", () => {
      expect(template.curatorId).toEqual(mockCuratorId);
    });

    it("should return the correct name", () => {
      expect(template.name).toEqual(mockName);
    });

    it("should return the correct description", () => {
      expect(template.description).toEqual(mockDescription);
    });

    it("should return a copy of the annotationFields array", () => {
      const fields = template.annotationFields;
      expect(fields).toEqual([mockField1, mockField2]);
      // Ensure it's a copy (modifying the returned array shouldn't affect the original)
      fields.push(mockField3);
      expect(template.annotationFields).toEqual([mockField1, mockField2]); // Original should be unchanged
    });

    it("should return the correct createdAt date", () => {
      expect(template.createdAt).toEqual(createdAt);
    });

    it("should return the correct publishedRecordId", () => {
      expect(template.publishedRecordId).toEqual(mockPublishedRecordId);
    });
  });

  describe("updatePublishedRecordId", () => {
    it("should update the publishedRecordId", () => {
      const props = {
        curatorId: mockCuratorId,
        name: mockName,
        description: mockDescription,
        annotationFields: [mockField1],
      };
      const template = AnnotationTemplate.create(props).getValue();
      expect(template.publishedRecordId).toBeUndefined();

      const newRecordId = PublishedRecordId.create(
        "at://did:example:repo/app.annos.annotationTemplate/newTemplate456"
      );
      template.updatePublishedRecordId(newRecordId);

      expect(template.publishedRecordId).toEqual(newRecordId);
    });

    it("should overwrite an existing publishedRecordId", () => {
      const initialRecordId = PublishedRecordId.create(
        "at://did:example:repo/app.annos.annotationTemplate/initialTemplate"
      );
      const props = {
        curatorId: mockCuratorId,
        name: mockName,
        description: mockDescription,
        annotationFields: [mockField1],
        publishedRecordId: initialRecordId,
      };
      const template = AnnotationTemplate.create(props).getValue();
      expect(template.publishedRecordId).toEqual(initialRecordId);

      const updatedRecordId = PublishedRecordId.create(
        "at://did:example:repo/app.annos.annotationTemplate/updatedTemplate789"
      );
      template.updatePublishedRecordId(updatedRecordId);

      expect(template.publishedRecordId).toEqual(updatedRecordId);
    });
  });

  describe("addField", () => {
    let template: AnnotationTemplate;

    beforeEach(() => {
      // Create a fresh template before each test in this suite
      const props = {
        curatorId: mockCuratorId,
        name: mockName,
        description: mockDescription,
        annotationFields: [mockField1], // Start with one field
      };
      template = AnnotationTemplate.create(props).getValue();
    });

    it("should add a new field successfully", () => {
      expect(template.annotationFields).toHaveLength(1);
      const result = template.addField(mockField2); // Add a different field

      expect(result.isSuccess).toBe(true);
      expect(template.annotationFields).toHaveLength(2);
      expect(template.annotationFields).toContain(mockField1);
      expect(template.annotationFields).toContain(mockField2);
    });

    it("should fail to add a field that already exists", () => {
      expect(template.annotationFields).toHaveLength(1);
      const result = template.addField(mockField1); // Try to add the same field again

      expect(result.isFailure).toBe(true);
      expect(template.annotationFields).toHaveLength(1); // Length should not change
      expect(result.getErrorValue()).toContain("Field already exists");
    });
  });

  describe("removeField", () => {
    let template: AnnotationTemplate;

    beforeEach(() => {
      // Create a fresh template with multiple fields
      const props = {
        curatorId: mockCuratorId,
        name: mockName,
        description: mockDescription,
        annotationFields: [mockField1, mockField2, mockField3],
      };
      template = AnnotationTemplate.create(props).getValue();
    });

    it("should remove an existing field successfully", () => {
      expect(template.annotationFields).toHaveLength(3);
      const result = template.removeField(fieldId2.getValue()); // Remove mockField2 by its ID

      expect(result.isSuccess).toBe(true);
      expect(template.annotationFields).toHaveLength(2);
      expect(template.annotationFields).toContain(mockField1);
      expect(template.annotationFields).not.toContain(mockField2);
      expect(template.annotationFields).toContain(mockField3);
    });

    it("should fail to remove a field that does not exist", () => {
      expect(template.annotationFields).toHaveLength(3);
      const nonExistentId = new UniqueEntityID("non-existent-field");
      const result = template.removeField(nonExistentId);

      expect(result.isFailure).toBe(true);
      expect(template.annotationFields).toHaveLength(3); // Length should not change
      expect(result.getErrorValue()).toContain("Field not found");
    });

    it("should fail to remove the last field", () => {
      // Create a template with only one field
      const singleFieldProps = {
        curatorId: mockCuratorId,
        name: mockName,
        description: mockDescription,
        annotationFields: [mockField1],
      };
      const singleFieldTemplate =
        AnnotationTemplate.create(singleFieldProps).getValue();

      expect(singleFieldTemplate.annotationFields).toHaveLength(1);
      const result = singleFieldTemplate.removeField(fieldId1.getValue()); // Try to remove the only field

      expect(result.isFailure).toBe(true);
      expect(singleFieldTemplate.annotationFields).toHaveLength(1); // Length should not change
      expect(result.getErrorValue()).toContain("Cannot remove the last field");
    });
  });

  describe("updateName", () => {
    it("should update the template name", () => {
      const props = {
        curatorId: mockCuratorId,
        name: mockName,
        description: mockDescription,
        annotationFields: [mockField1],
      };
      const template = AnnotationTemplate.create(props).getValue();
      const newName = AnnotationTemplateName.create(
        "Updated Template Name"
      ).getValue();

      const result = template.updateName(newName);

      expect(result.isSuccess).toBe(true);
      expect(template.name).toEqual(newName);
    });
  });

  describe("updateDescription", () => {
    it("should update the template description", () => {
      const props = {
        curatorId: mockCuratorId,
        name: mockName,
        description: mockDescription,
        annotationFields: [mockField1],
      };
      const template = AnnotationTemplate.create(props).getValue();
      const newDescription = AnnotationTemplateDescription.create(
        "Updated Template Description"
      ).getValue();

      const result = template.updateDescription(newDescription);

      expect(result.isSuccess).toBe(true);
      expect(template.description).toEqual(newDescription);
    });
  });
});
