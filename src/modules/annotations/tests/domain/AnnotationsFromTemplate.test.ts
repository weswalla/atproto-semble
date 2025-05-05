import { AnnotationsFromTemplate } from "../../domain/aggregates/AnnotationsFromTemplate";
import { AnnotationBuilder } from "../utils/builders/AnnotationBuilder";
import { AnnotationTemplateBuilder } from "../utils/builders/AnnotationTemplateBuilder";
import { AnnotationFieldBuilder } from "../utils/builders/AnnotationFieldBuilder";
import { UniqueEntityID } from "../../../../shared/domain/UniqueEntityID";
import { CuratorId } from "../../domain/value-objects";

describe.only("AnnotationsFromTemplate", () => {
  const curatorId = "did:plc:testcurator123";
  const templateId = new UniqueEntityID("template-123");

  it("results in an error when the annotations don't match the template fields", () => {
    // Create a template with required fields
    const template = new AnnotationTemplateBuilder()
      .withId(templateId)
      .withCuratorId(curatorId)
      .withName("Test Template")
      .addDyadField("Field 1", "Description 1", "Left", "Right", true) // Required field
      .buildOrThrow();

    // Create a different field not in the template
    const differentField = new AnnotationFieldBuilder()
      .withCuratorId(curatorId)
      .withName("Different Field")
      .withDescription("A field not in the template")
      .withDyadDefinition({ sideA: "Different Left", sideB: "Different Right" })
      .buildOrThrow();

    // Create an annotation that doesn't match the template's required field
    const annotation = new AnnotationBuilder()
      .withCuratorId(curatorId)
      .withUrl("https://example.com/resource")
      .withAnnotationField(differentField) // Different field
      .withDyadValue(0.5)
      .withAnnotationTemplateIds([templateId.toString()])
      .buildOrThrow();

    // Attempt to create AnnotationsFromTemplate should throw
    const annotationsFromTemplateResult = AnnotationsFromTemplate.create({
      annotations: [annotation],
      template,
      curatorId: CuratorId.create(curatorId).unwrap(),
    });
    expect(annotationsFromTemplateResult.isErr()).toBe(true);
  });

  it("can be instantiated with valid annotations and a template", () => {
    // Create a template with fields
    const template = new AnnotationTemplateBuilder()
      .withId(templateId)
      .withCuratorId(curatorId)
      .withName("Test Template")
      .addDyadField("Field 1", "Description 1", "Left", "Right", true)
      .addRatingField("Field 2", "Description 2", false)
      .buildOrThrow();

    // Get the fields from the template
    const fields = template.annotationTemplateFields.annotationTemplateFields;
    const field1 = fields[0]!.annotationField;

    // Create annotations that match the template's fields
    const annotation1 = new AnnotationBuilder()
      .withCuratorId(curatorId)
      .withUrl("https://example.com/resource")
      .withAnnotationField(field1)
      .withDyadValue(0.5)
      .withAnnotationTemplateIds([templateId.toString()])
      .buildOrThrow();

    // Create AnnotationsFromTemplate should not throw
    const annotationsFromTemplateResult = AnnotationsFromTemplate.create({
      annotations: [annotation1],
      template,
      curatorId: CuratorId.create(curatorId).unwrap(),
    });
    const annotationsFromTemplate = annotationsFromTemplateResult.unwrap();

    expect(annotationsFromTemplate).toBeDefined();
    expect(annotationsFromTemplate.props.template).toBe(template);
    expect(annotationsFromTemplate.props.annotations).toContain(annotation1);
  });

  it("validates that all required fields are present", () => {
    // Create a template with a required field
    const template = new AnnotationTemplateBuilder()
      .withId(templateId)
      .withCuratorId(curatorId)
      .withName("Test Template")
      .addDyadField("Field 1", "Description 1", "Left", "Right", true) // Required
      .addRatingField("Field 2", "Description 2", true) // Also required
      .buildOrThrow();

    // Get the fields from the template
    const fields = template.annotationTemplateFields.annotationTemplateFields;
    const field1 = fields[0]!.annotationField;

    // Create only one annotation, missing the second required field
    const annotation1 = new AnnotationBuilder()
      .withCuratorId(curatorId)
      .withUrl("https://example.com/resource")
      .withAnnotationField(field1)
      .withDyadValue(0.5)
      .withAnnotationTemplateIds([templateId.toString()])
      .buildOrThrow();

    // Attempt to create AnnotationsFromTemplate should throw
    const annotationsFromTemplateResult = AnnotationsFromTemplate.create({
      annotations: [annotation1],
      template,
      curatorId: CuratorId.create(curatorId).unwrap(),
    });

    expect(annotationsFromTemplateResult.isErr()).toBe(true);
  });
});
