import { UniqueEntityID } from "../../../../shared/domain/UniqueEntityID";
import { Result } from "../../../../shared/core/Result";
import { AnnotationTemplate } from "./AnnotationTemplate";
import {
  AnnotationFieldId,
  AnnotationTemplateDescription,
  AnnotationTemplateField,
  AnnotationTemplateFields, // <-- Import the collection class
  AnnotationTemplateName,
  CuratorId,
  PublishedRecordId,
} from "../value-objects";
// Import the interface defining the aggregate's props
import { AnnotationTemplateProps } from "./AnnotationTemplate";
// Define a type for the builder's internal props, which might differ slightly
// especially during construction before the collection is created.
type BuilderProps = Omit<AnnotationTemplateProps, "annotationFields"> & {
  annotationFields?: AnnotationTemplateField[]; // Builder initially holds an array
};

// --- Builder ---
interface BuilderField {
  id: string;
  required: boolean;
}

class AnnotationTemplateBuilder {
  // Use the builder-specific props type internally
  private props: Partial<BuilderProps> = {};
  private rawFields: BuilderField[] = [];
  private id?: UniqueEntityID;
  private curatorIdStr: string = "did:plc:builderCurator";
  private nameStr: string = "Builder Template Name";
  private descriptionStr: string = "Builder Template Description";
  private publishedRecordIdStr?: string;
  private createdAtDate?: Date;

  withId(id: UniqueEntityID): this {
    this.id = id;
    return this;
  }

  withCuratorId(did: string): this {
    this.curatorIdStr = did;
    return this;
  }

  withName(name: string): this {
    this.nameStr = name;
    return this;
  }

  withDescription(description: string): this {
    this.descriptionStr = description;
    return this;
  }

  withPublishedRecordId(atUri: string): this {
    this.publishedRecordIdStr = atUri;
    return this;
  }

  withCreatedAt(date: Date): this {
    this.createdAtDate = date;
    return this;
  }

  addField(id: string, required: boolean): this {
    this.rawFields.push({ id, required });
    return this;
  }

  // Default setup for a valid template
  withValidDefaults(): this {
    return this.addField("field-1", true).addField("field-2", false);
  }

  build(): Result<AnnotationTemplate> {
    const curatorIdResult = CuratorId.create(this.curatorIdStr);
    const nameResult = AnnotationTemplateName.create(this.nameStr);
    const descriptionResult = AnnotationTemplateDescription.create(
      this.descriptionStr
    );

    let publishedRecordId: PublishedRecordId | undefined;
    if (this.publishedRecordIdStr) {
      try {
        publishedRecordId = PublishedRecordId.create(this.publishedRecordIdStr);
      } catch (e: any) {
        return Result.fail<AnnotationTemplate>(
          `Builder failed: Invalid PublishedRecordId: ${e.message}`
        );
      }
    }

    const fieldResults: Result<AnnotationTemplateField>[] = this.rawFields.map(
      (f) => {
        const fieldIdResult = AnnotationFieldId.create(
          new UniqueEntityID(f.id)
        );
        if (fieldIdResult.isFailure) {
          // This shouldn't typically fail if UniqueEntityID constructor is used directly
          return Result.fail<AnnotationTemplateField>(
            `Builder failed: Could not create AnnotationFieldId for ${f.id}: ${fieldIdResult.getErrorValue()}`
          );
        }
        return AnnotationTemplateField.create({
          annotationFieldId: fieldIdResult.getValue(),
          required: f.required,
        });
      }
    );

    const combinedResult = Result.combine([
      curatorIdResult,
      nameResult,
      descriptionResult,
      ...fieldResults,
    ]);

    if (combinedResult.isFailure) {
      return Result.fail<AnnotationTemplate>(
        `Builder failed: ${combinedResult.getErrorValue()}`
      );
    }

    // Create the raw array of field value objects
    const annotationFieldVOs = fieldResults.map((r) => r.getValue());

    // Create the AnnotationTemplateFields collection from the array
    const annotationFieldsResult =
      AnnotationTemplateFields.create(annotationFieldVOs);
    if (annotationFieldsResult.isFailure) {
      // Propagate the failure from the collection creation
      return Result.fail<AnnotationTemplate>(
        `Builder failed: ${annotationFieldsResult.getErrorValue()}`
      );
    }
    const annotationFieldsCollection = annotationFieldsResult.getValue();

    // Construct the final props for the AnnotationTemplate aggregate
    const aggregateProps: AnnotationTemplateProps = {
      curatorId: curatorIdResult.getValue(),
      name: nameResult.getValue(),
      description: descriptionResult.getValue(),
      annotationFields: annotationFieldsCollection, // Use the collection object
      publishedRecordId: publishedRecordId,
      createdAt: this.createdAtDate,
    };

    // Pass the specific ID if it was set on the builder
    // Note: AnnotationTemplate.create now expects AnnotationTemplateProps directly
    return AnnotationTemplate.create(aggregateProps, this.id);
  }
}

// --- Test Suite ---
describe("AnnotationTemplate Aggregate", () => {
  // --- Create Method Tests ---
  describe("create (via Builder)", () => {
    it("should create a new AnnotationTemplate successfully with valid props", () => {
      const builder = new AnnotationTemplateBuilder()
        .withCuratorId("did:plc:curator1")
        .withName("Valid Template")
        .withDescription("This is a valid description.")
        .addField("f1", true)
        .addField("f2", false);

      const result = builder.build();

      expect(result.isSuccess).toBe(true);
      const template = result.getValue();
      expect(template).toBeInstanceOf(AnnotationTemplate);
      expect(template.id).toBeInstanceOf(UniqueEntityID);
      expect(template.curatorId.value).toBe("did:plc:curator1");
      expect(template.name.value).toBe("Valid Template");
      expect(template.description.value).toBe("This is a valid description.");
      // Access the count or fields property of the collection
      expect(template.annotationFields.count()).toBe(2);
      expect(template.annotationFields.fields).toHaveLength(2);
      const fields = template.annotationFields.fields; // Get the underlying array for easier access if needed
      expect(fields[0]?.annotationFieldId.getStringValue()).toBe("f1");
      expect(fields[0]?.required).toBe(true);
      expect(fields[1]?.annotationFieldId.getStringValue()).toBe("f2");
      expect(fields[1]?.required).toBe(false);
      expect(template.createdAt).toBeInstanceOf(Date);
      expect(template.publishedRecordId).toBeUndefined();
    });

    it("should fail build if a required Value Object creation fails (e.g., empty name)", () => {
      const builder = new AnnotationTemplateBuilder()
        .withName("") // Invalid name
        .withValidDefaults();

      const result = builder.build();

      expect(result.isFailure).toBe(true);
      // Check that the error message comes from the builder/VO failure
      expect(result.getErrorValue()).toContain("Builder failed:");
      expect(result.getErrorValue()).toContain("cannot be empty"); // From AnnotationTemplateName.create
    });

    it("should fail creation if annotationFields array is empty", () => {
      const builder = new AnnotationTemplateBuilder()
        .withCuratorId("did:plc:curator2")
        .withName("No Fields Template")
        .withDescription("This template has no fields.");
      // No calls to .addField()

      // No calls to .addField()

      const result = builder.build();

      expect(result.isFailure).toBe(true);
      // This error now comes from AnnotationTemplateFields.create via the builder
      expect(result.getErrorValue()).toContain("Builder failed:");
      expect(result.getErrorValue()).toContain(
        "AnnotationTemplate must include at least one field"
      );
    });

    it("should fail creation if annotationFields array contains duplicates", () => {
      const builder = new AnnotationTemplateBuilder()
        .withCuratorId("did:plc:curator3")
        .withName("Duplicate Fields Template")
        .withDescription("This template has duplicate fields.")
        .addField("f1", true)
        .addField("f1", false); // Duplicate field ID

      const result = builder.build();

      expect(result.isFailure).toBe(true);
      // This error now comes from AnnotationTemplateFields.create via the builder
      expect(result.getErrorValue()).toContain("Builder failed:");
      expect(result.getErrorValue()).toContain(
        "AnnotationTemplate cannot contain duplicate fields"
      );
    });
  });

  // --- Instance Method Tests ---
  // Helper to create a valid template instance for method testing
  const createValidTemplate = (): AnnotationTemplate => {
    const builder = new AnnotationTemplateBuilder().withValidDefaults();
    const result = builder.build();
    if (result.isFailure) {
      throw new Error(
        `Failed to create valid template for testing using builder: ${result.getErrorValue()}`
      );
    }
    return result.getValue();
  };

  describe("updatePublishedRecordId", () => {
    it("should update the publishedRecordId", () => {
      const template = createValidTemplate();
      expect(template.publishedRecordId).toBeUndefined(); // Check initial state

      const newRecordIdStr =
        "at://did:plc:repo/app.annos.annotationTemplate/newTemplate456";
      let newRecordId: PublishedRecordId;
      try {
        newRecordId = PublishedRecordId.create(newRecordIdStr);
      } catch (e) {
        throw new Error(
          "Test setup failed: Could not create PublishedRecordId"
        );
      }

      template.updatePublishedRecordId(newRecordId);

      expect(template.publishedRecordId).toEqual(newRecordId);
      expect(template.publishedRecordId?.getValue()).toEqual(newRecordIdStr);
    });
  });

  describe("addField", () => {
    it("should add a new field successfully", () => {
      const template = createValidTemplate();
      const initialCount = template.annotationFields.count();

      // Create the new field VO
      const newFieldIdResult = AnnotationFieldId.create(
        new UniqueEntityID("new-field")
      );
      expect(newFieldIdResult.isSuccess).toBe(true); // Check VO creation
      const newFieldResult = AnnotationTemplateField.create({
        annotationFieldId: newFieldIdResult.getValue(),
        required: false,
      });
      expect(newFieldResult.isSuccess).toBe(true); // Check VO creation
      const newField = newFieldResult.getValue();

      const result = template.addField(newField);

      expect(result.isSuccess).toBe(true);
      expect(template.annotationFields.count()).toBe(initialCount + 1);
      // Check if the field exists using the collection's findById or by checking the fields array
      expect(
        template.annotationFields.findById(
          newField.annotationFieldId.getValue()
        )
      ).toEqual(newField);
      // Or check the raw array
      expect(template.annotationFields.fields).toContainEqual(newField);
    });

    it("should fail to add a field that already exists", () => {
      const template = createValidTemplate();
      const initialCount = template.annotationFields.count();
      const existingField = template.annotationFields.fields[0]; // Get an existing field from the collection
      expect(existingField).toBeDefined(); // Ensure it exists

      const result = template.addField(existingField!); // Try to add it again

      expect(result.isFailure).toBe(true);
      expect(template.annotationFields.count()).toBe(initialCount); // Count should not change
      // Error comes from AnnotationTemplateFields.add
      expect(result.getErrorValue()).toContain("Field already exists");
    });
  });

  describe("removeField", () => {
    it("should remove an existing field successfully", () => {
      const template = createValidTemplate(); // Has field-1 and field-2
      expect(template.annotationFields.count()).toBe(2);
      const fieldIdToRemove = new UniqueEntityID("field-1"); // ID of the field to remove

      const result = template.removeField(fieldIdToRemove);

      expect(result.isSuccess).toBe(true);
      expect(template.annotationFields.count()).toBe(1);
      // Check that the remaining field is field-2 using findById or accessing the fields array
      expect(
        template.annotationFields.findById(fieldIdToRemove)
      ).toBeUndefined();
      expect(
        template.annotationFields.findById(new UniqueEntityID("field-2"))
      ).toBeDefined();
      // Or check the raw array
      expect(template.annotationFields.fields).toHaveLength(1);
      expect(
        template.annotationFields.fields[0]?.annotationFieldId
          .getValue()
          .equals(new UniqueEntityID("field-2"))
      ).toBe(true);
    });

    it("should fail to remove a non-existent field", () => {
      const template = createValidTemplate(); // Has field-1 and field-2
      const initialCount = template.annotationFields.count();
      const nonExistentFieldId = new UniqueEntityID("non-existent-field");

      const result = template.removeField(nonExistentFieldId);

      expect(result.isFailure).toBe(true);
      expect(template.annotationFields.count()).toBe(initialCount); // Count should not change
      // Error comes from AnnotationTemplateFields.remove
      expect(result.getErrorValue()).toContain("Field not found");
    });

    it("should fail to remove the last field", () => {
      // Use builder to create a template with only one field
      const builder = new AnnotationTemplateBuilder().addField(
        "only-field",
        true
      );
      const buildResult = builder.build();
      expect(buildResult.isSuccess).toBe(true); // Ensure creation succeeded
      const singleFieldTemplate = buildResult.getValue();

      expect(singleFieldTemplate.annotationFields.count()).toBe(1);
      const fieldIdToRemove = new UniqueEntityID("only-field");
      const result = singleFieldTemplate.removeField(fieldIdToRemove); // Try to remove the only field

      expect(result.isFailure).toBe(true);
      expect(singleFieldTemplate.annotationFields.count()).toBe(1); // Count should not change
      // Error comes from AnnotationTemplateFields.create called within remove
      expect(result.getErrorValue()).toContain(
        "AnnotationTemplate must include at least one field"
      );
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
