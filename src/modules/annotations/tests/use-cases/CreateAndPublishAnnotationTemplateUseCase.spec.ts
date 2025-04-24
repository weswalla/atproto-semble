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
    // const annotationFieldRepository = new InMemoryAnnotationFieldRepository(); // No longer injected directly for saving
    const annotationTemplatePublisher = new FakeAnnotationTemplatePublisher();
    const annotationFieldPublisher = new FakeAnnotationFieldPublisher(); // Keep for publishing

    // Mock the repository used internally by the template repo if needed for field checks
    // Or rely on checking the retrieved template's fields
    const internalFieldRepo = new InMemoryAnnotationFieldRepository();
    annotationTemplateRepository.setInternalFieldRepo(internalFieldRepo); // Assuming this method exists for testing

    const createAndPublishAnnotationTemplateUseCase =
      new CreateAndPublishAnnotationTemplateUseCase(
        annotationTemplateRepository,
        // annotationFieldRepository, // Removed
        annotationTemplatePublisher,
        annotationFieldPublisher,
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

    // then: the result is successful (Ok) and contains the template ID
    expect(result.isOk()).toBe(true); // Use isOk()
    // Type assertion is safer within the isOk check
    if (result.isOk()) {
      const resultValue = result.value; // Access value directly
      expect(resultValue.templateId).toBeDefined();

      // then: the annotation template and fields were saved and include their published record id
      const template: AnnotationTemplate | null =
        await annotationTemplateRepository.findByIdString(resultValue.templateId); // Assuming findByIdString exists or adapt as needed
    expect(template).toBeDefined();
    expect(template).not.toBeNull();
    expect(template!.publishedRecordId).toBeDefined();
    expect(template!.publishedRecordId?.getValue()).toMatch(
      /^at:\/\/fake-did\/app\.annos\.template\//,
    ); // Check format

    // Check fields *within* the retrieved template aggregate
    const fieldsInTemplate = template!.getFields();
    expect(fieldsInTemplate).toBeDefined();
    expect(fieldsInTemplate.length).toBe(
      createAndPublishAnnotationTemplateDTO.fields.length,
    );

    // Verify each field within the template has its publishedRecordId set
    fieldsInTemplate.forEach((field) => {
      expect(field.publishedRecordId).toBeDefined();
      expect(field.publishedRecordId?.getValue()).toMatch(
        /^at:\/\/fake-did\/app\.annos\.field\//,
      ); // Check format
    });

    // Optionally, also check the internal field repo if needed for deeper verification
    const fieldIdValueObjects = fieldsInTemplate.map((f) => f.fieldId);
    const fieldIdStrings = fieldIdValueObjects.map((id) => id.getStringValue());
    const fieldsInRepo: AnnotationField[] =
      await internalFieldRepo.findByFieldIds(fieldIdStrings); // Use the internal repo instance

    expect(fieldsInRepo).toBeDefined();
    expect(fieldsInRepo.length).toBe(
      createAndPublishAnnotationTemplateDTO.fields.length,
    );
    fieldsInRepo.forEach((field) => {
      expect(field.publishedRecordId).toBeDefined();
      expect(field.publishedRecordId?.getValue()).toMatch(
        /^at:\/\/fake-did\/app\.annos\.field\//,
      );
    });
    } else {
      // Fail test if result is Err
      fail('Expected result to be Ok, but it was Err: ' + result.error.message);
    }
  });

  // Add more tests for error cases (e.g., invalid input, publisher failure, repo failure)
});
