import { AnnotationTemplate } from "../../domain/aggregates";
import { InMemoryAnnotationTemplateRepository } from "../../infrastructure/persistence/repositories/InMemoryAnnotationTemplateRepository";
import { FakeAnnotationFieldPublisher } from "../utils/FakeAnnotationFieldPublisher";
import { FakeAnnotationTemplatePublisher } from "../utils/FakeAnnotationTemplatePublisher";
import { CreateAndPublishAnnotationTemplateUseCase } from "../../application/use-cases/CreateAndPublishAnnotationTemplateUseCase";
import { AnnotationTemplateId } from "../../domain/value-objects";
import { UniqueEntityID } from "src/shared/domain/UniqueEntityID";
import { AnnotationTemplateDTOBuilder } from "../utils/AnnotationTemplateDTOBuilder";

describe("CreateAndPublishAnnotationTemplateUseCase", () => {
  it("can publish a valid annotation template, along with all of its fields, and include the published record id", async () => {
    const annotationTemplateRepository =
      new InMemoryAnnotationTemplateRepository();
    const annotationTemplatePublisher = new FakeAnnotationTemplatePublisher();
    const annotationFieldPublisher = new FakeAnnotationFieldPublisher(); // Keep for publishing

    const createAndPublishAnnotationTemplateUseCase =
      new CreateAndPublishAnnotationTemplateUseCase(
        annotationTemplateRepository,
        annotationTemplatePublisher,
        annotationFieldPublisher
      );

    // Given: a valid annotation template and fields
    const createAndPublishAnnotationTemplateDTO =
      new AnnotationTemplateDTOBuilder()
        .withCuratorId("did:plc:1234")
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

    // then: the result is successful (Ok) and contains the template ID
    expect(result.isOk()).toBe(true); // Use isOk()
    // Type assertion is safer within the isOk check
    if (result.isOk()) {
      const resultValue = result.value; // Access value directly
      expect(resultValue.templateId).toBeDefined();

      // then: the annotation template and fields were saved and include their published record id
      const template: AnnotationTemplate | null =
        await annotationTemplateRepository.findById(
          AnnotationTemplateId.create(
            new UniqueEntityID(resultValue.templateId)
          ).unwrap()
        ); // Assuming findByIdString exists or adapt as needed
      expect(template).toBeDefined();
      expect(template).not.toBeNull();
      expect(template!.publishedRecordId).toBeDefined();
      expect(template!.publishedRecordId?.getValue()).toMatch(
        /^at:\/\/fake-did\/app\.annos\.template\//
      ); // Check format

      // Check fields *within* the retrieved template aggregate
      expect(template!.hasUnpublishedFields()).toBe(false); // All fields should be published
    } else {
      // Fail test if result is Err
      fail("Expected result to be Ok, but it was Err: " + result.error);
    }
  });

  // Add more tests for error cases (e.g., invalid input, publisher failure, repo failure)
});
