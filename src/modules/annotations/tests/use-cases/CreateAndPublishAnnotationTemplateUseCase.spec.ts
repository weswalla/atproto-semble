import { AnnotationField, AnnotationTemplate } from "../../domain/aggregates";
import { InMemoryAnnotationFieldRepository } from "../../infrastructure/persistence/repositories/InMemoryAnnotationFieldRepository";
import { InMemoryAnnotationTemplateRepository } from "../../infrastructure/persistence/repositories/InMemoryAnnotationTemplateRepository";
import { FakeAnnotationFieldPublisher } from "../infrastructure/FakeAnnotationFieldPublisher";
import { FakeAnnotationTemplatePublisher } from "../infrastructure/FakeAnnotationTemplatePublisher";

describe("CreateAndPublishAnnotationTemplateUseCase", () => {
  it("can publish a valid annotation template, along with all of its fields, and include the published record id", async () => {
    const annotationTemplateRepository =
      new InMemoryAnnotationTemplateRepository();
    const annotationFieldRepository = new InMemoryAnnotationFieldRepository();
    const annotationTemplatePublisher = new FakeAnnotationTemplatePublisher();
    const annotationFieldPublisher = new FakeAnnotationFieldPublisher();

    const createAndPublishAnnotationTemplateUseCase =
      new CreateAndPublishAnnotationTemplateUseCase(
        annotationTemplateRepository,
        annotationFieldRepository,
        annotationTemplatePublisher,
        annotationFieldPublisher
      );

    // Given: a valid annotation template and fields
    const createAndPublishAnnotationTemplateDTO =
      new AnnotationTemplateDTOBuilder()
        .withCuratorId("curatorId")
        .withName("Test Template")
        .withDescription("Test Description")
        .addField({
          name: "Field 1",
          description: "Field 1 Description",
          type: "dyad",
          definition: {
            sideA: "Side A",
            sideB: "Side B",
          },
        })
        .build();

    // when: the template is created and published
    const result = await createAndPublishAnnotationTemplateUseCase.execute(
      createAndPublishAnnotationTemplateDTO
    );

    // then: the annotation template and fields include their published record id
    expect(result.isSuccess).toBe(true);
    const template: AnnotationTemplate =
      await annotationTemplateRepository.findById(result.value.templateId);
    expect(template).toBeDefined();
    expect(template?.publishedRecordId).toBeDefined();

    const fieldIdStrings = template.annotationFields.getFieldIds();
    const fields: AnnotationField[] =
      await annotationFieldRepository.findByFieldIds(fieldIdStrings);
    expect(fields).toBeDefined();
    fields.forEach((field) => {
      expect(field.publishedRecordId).toBeDefined();
    });
  });
});
