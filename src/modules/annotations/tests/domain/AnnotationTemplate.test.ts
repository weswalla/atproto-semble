import { AnnotationTemplate } from "../../domain/aggregates";
import { AnnotationFieldDefinitionFactory } from "../../domain/AnnotationFieldDefinitionFactory";
import {
  AnnotationTemplateDescription,
  AnnotationTemplateField,
  AnnotationTemplateFields,
  AnnotationTemplateName,
  CuratorId,
  PublishedRecordId,
} from "../../domain/value-objects";
import { AnnotationType } from "../../domain/value-objects/AnnotationType";
import { AnnotationFieldBuilder } from "../utils/AnnotationFieldBuilder";

describe.skip("AnnotationTemplate", () => {
  const curatorId = CuratorId.create("did:plc:1234").unwrap();
  const name = AnnotationTemplateName.create("Test Template").unwrap();
  const description =
    AnnotationTemplateDescription.create("Test Description").unwrap();
  it("should throw error when no fields provided", () => {
    const fields = AnnotationTemplateFields.create([]);
    expect(fields.isErr()).toBe(true);
  });
  it("should create an AnnotationTemplate with valid fields", () => {
    const annotationFieldDefinition = AnnotationFieldDefinitionFactory.create({
      type: AnnotationType.create("dyad"),
      fieldDefProps: {
        sideA: "Side A",
        sideB: "Side B",
      },
    });
    const annotationField = new AnnotationFieldBuilder()
      .withName("Field 1")
      .withDescription("Field 1 Description")
      .withDefinition(annotationFieldDefinition.unwrap())
      .build();

    if (annotationField.isErr()) {
      throw new Error("Failed to create annotation field");
    }
    const annotationTemplateField = AnnotationTemplateField.create({
      annotationField: annotationField.value,
      required: true,
    });
    const fields = AnnotationTemplateFields.create([
      annotationTemplateField.unwrap(),
    ]);

    const annotationTemplateResult = AnnotationTemplate.create({
      curatorId,
      name,
      description,
      annotationTemplateFields: fields.unwrap(),
    });
    expect(annotationTemplateResult.isOk()).toBe(true);
    expect(annotationTemplateResult.unwrap().getAnnotationFields().length).toBe(
      1
    );
    expect(
      annotationTemplateResult.unwrap().annotationTemplateFields
        .annotationTemplateFields.length
    ).toBe(1);
    const annotationTemplate = annotationTemplateResult.unwrap();
    expect(annotationTemplate.hasUnpublishedFields()).toBe(true);
    annotationTemplate.markAnnotationTemplateFieldAsPublished(
      annotationField.unwrap().fieldId,
      PublishedRecordId.create("at://fake.uri")
    );
    expect(annotationTemplate.hasUnpublishedFields()).toBe(false);
  });
});
