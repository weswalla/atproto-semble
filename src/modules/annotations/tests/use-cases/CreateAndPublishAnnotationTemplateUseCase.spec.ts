import { AnnotationField, AnnotationTemplate } from "../../domain/aggregates";
import { InMemoryAnnotationFieldRepository } from "../../infrastructure/persistence/repositories/InMemoryAnnotationFieldRepository";
import { InMemoryAnnotationTemplateRepository } from "../../infrastructure/persistence/repositories/InMemoryAnnotationTemplateRepository";
import { FakeAnnotationFieldPublisher } from '../infrastructure/FakeAnnotationFieldPublisher';
import { FakeAnnotationTemplatePublisher } from '../infrastructure/FakeAnnotationTemplatePublisher';
import { CreateAndPublishAnnotationTemplateUseCase } from '../../application/use-cases/CreateAndPublishAnnotationTemplateUseCase';
import { AnnotationTemplateDTOBuilder } from '../builders/AnnotationTemplateDTOBuilder'; // Assuming this builder exists

describe('CreateAndPublishAnnotationTemplateUseCase', () => {
  it('can publish a valid annotation template, along with all of its fields, and include the published record id', async () => {
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
      createAndPublishAnnotationTemplateDTO,
    );

    // then: the result is successful and contains the template ID
    expect(result.isRight()).toBe(true);
    const resultValue = result.value as { templateId: string }; // Type assertion for success case
    expect(resultValue.templateId).toBeDefined();

    // then: the annotation template and fields were saved and include their published record id
    const template: AnnotationTemplate | null =
      await annotationTemplateRepository.findByIdString(resultValue.templateId); // Assuming findByIdString exists or adapt as needed
    expect(template).toBeDefined();
    expect(template).not.toBeNull();
    expect(template!.publishedRecordId).toBeDefined();
    expect(template!.publishedRecordId?.getValue()).toMatch(/^at:\/\/fake-did\/app\.annos\.template\//); // Check format

    const fieldIdValueObjects = template!.annotationFields.getFieldIds(); // Get AnnotationFieldId[]
    const fieldIdStrings = fieldIdValueObjects.map((id) => id.getStringValue()); // Convert to string[]

    // Assuming findByFieldIds takes string[] or adapt as needed
    const fields: AnnotationField[] =
      await annotationFieldRepository.findByFieldIds(fieldIdStrings);

    expect(fields).toBeDefined();
    expect(fields.length).toBe(
      createAndPublishAnnotationTemplateDTO.fields.length,
    ); // Ensure all fields were found

    fields.forEach((field) => {
      expect(field.publishedRecordId).toBeDefined();
      expect(field.publishedRecordId?.getValue()).toMatch(/^at:\/\/fake-did\/app\.annos\.field\//); // Check format
    });
  });

  // Add more tests for error cases (e.g., invalid input, publisher failure, repo failure)
});
