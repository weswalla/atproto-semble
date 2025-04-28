import { FakeAnnotationPublisher } from "../utils/FakeAnnotationPublisher"; // Assuming this exists
import { CreateAndPublishAnnotationUseCase } from "../../application/use-cases/CreateAndPublishAnnotationsFromTemplateUseCase";
import { Annotation } from "../../domain/aggregates/Annotation";
import { AnnotationId } from "../../domain/value-objects";
import { UniqueEntityID } from "../../../../shared/domain/UniqueEntityID";
// import { AnnotationDTOBuilder } from '../utils/AnnotationDTOBuilder'; // Assuming this will exist

// Minimal DTO for testing
const testAnnotationDTO = {
  curatorId: "did:example:curator123",
  url: "https://example.com/resource",
  annotationFieldId: new UniqueEntityID().toString(), // Generate a fake field ID
  value: { some: "data" }, // Example value
  note: "This is a test annotation.",
  annotationTemplateIds: [new UniqueEntityID().toString()], // Example template ID
};

describe("CreateAndPublishAnnotationUseCase", () => {
  let annotationRepository: InMemoryAnnotationRepository;
  let annotationPublisher: FakeAnnotationPublisher;
  let useCase: CreateAndPublishAnnotationUseCase;

  beforeEach(() => {
    annotationRepository = new InMemoryAnnotationRepository();
    annotationPublisher = new FakeAnnotationPublisher();
    useCase = new CreateAndPublishAnnotationUseCase(
      annotationRepository,
      annotationPublisher
    );
    // Mock field/template repo calls here if validation is added
  });

  it("should create and publish a valid annotation", async () => {
    // Arrange
    // const dto = new AnnotationDTOBuilder().build(); // Use builder when available
    const dto = { ...testAnnotationDTO };

    // Act
    const result = await useCase.execute(dto);

    // Assert
    expect(result.isOk()).toBe(true);

    if (result.isOk()) {
      const { annotationId } = result.value;
      expect(annotationId).toBeDefined();

      // Check repository
      const annotationIdVO = AnnotationId.create(
        new UniqueEntityID(annotationId)
      )._unsafeUnwrap(); // Use unwrap/getValue based on VO implementation
      const savedAnnotation =
        await annotationRepository.findById(annotationIdVO);

      expect(savedAnnotation).not.toBeNull();
      expect(savedAnnotation).toBeInstanceOf(Annotation);
      expect(savedAnnotation!.publishedRecordId).toBeDefined();
      expect(savedAnnotation!.publishedRecordId?.getValue()).toMatch(
        /^at:\/\/fake-did\/app\.annos\.annotation\//
      );
      expect(savedAnnotation!.curatorId.value).toBe(dto.curatorId);
      expect(savedAnnotation!.url.value).toBe(dto.url);
      expect(savedAnnotation!.annotationFieldId.getStringValue()).toBe(
        dto.annotationFieldId
      );
      expect(savedAnnotation!.value.props.value).toEqual(dto.value); // Adjust based on AnnotationValue structure
      expect(savedAnnotation!.note?.getValue()).toBe(dto.note);
      expect(
        savedAnnotation!.annotationTemplateIds?.map((id) => id.getStringValue())
      ).toEqual(dto.annotationTemplateIds);

      // Check publisher (optional, publisher might not store)
      // const publishedRecord = annotationPublisher.getPublishedRecord(savedAnnotation!.publishedRecordId!.getValue());
      // expect(publishedRecord).toBeDefined();
    } else {
      fail(`Expected Ok, got Err: ${result.error.message}`);
    }
  });

  // Add tests for error cases:
  // - Invalid DTO properties (failed VO creation)
  // - Field/Template validation failure (if added)
  // - Publisher failure
  // - Repository save failure
});
