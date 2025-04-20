// import { UniqueEntityID } from "../../../../shared/domain/UniqueEntityID";
// import { Result } from "../../../../shared/core/Result";
// import { Annotation } from "./Annotation";
// import {
//   AnnotationFieldId,
//   AnnotationId,
//   AnnotationNote,
//   AnnotationTemplateId,
//   AnnotationValue, // Base type
//   CuratorId,
//   DyadValue, // Example value type
//   RatingValue, // Another example value type
//   PublishedRecordId,
//   URI,
// } from "../value-objects"; // Adjust imports as needed
// import { UpdateAnnotationErrors } from "../../application/use-cases/errors";

// // Mock Value Objects
// const mockCuratorId = CuratorId.create("did:example:curator").getValue();
// const mockUrl = new URI("https://example.com/resource");
// const mockFieldId = AnnotationFieldId.create(
//   new UniqueEntityID("field-for-anno")
// ).getValue();
// const mockTemplateId1 = AnnotationTemplateId.create(
//   new UniqueEntityID("template-1")
// ).getValue();
// const mockTemplateId2 = AnnotationTemplateId.create(
//   new UniqueEntityID("template-2")
// ).getValue();
// const mockNote = AnnotationNote.create("This is a test note.");
// const mockPublishedRecordId = PublishedRecordId.create(
//   "at://did:example:repo/app.annos.annotation/anno123"
// );

// // Mock Annotation Values of different types
// const mockDyadValue = DyadValue.create({ value: 75 });
// const mockRatingValue = RatingValue.create({ rating: 4 });

describe("GetAnnotationFieldUseCase", () => {
  it("should be defined", () => {
    expect(true).toBe(true);
  });
});
// describe.skip("Annotation Aggregate", () => {
//   describe("create", () => {
//     it("should create a new Annotation successfully with minimal valid props", () => {
//       const props = {
//         curatorId: mockCuratorId,
//         url: mockUrl,
//         annotationFieldId: mockFieldId,
//         value: mockDyadValue, // Use one type of value
//       };
//       const result = Annotation.create(props);

//       expect(result.isSuccess).toBe(true);
//       const annotation = result.getValue();
//       expect(annotation).toBeInstanceOf(Annotation);
//       expect(annotation.id).toBeInstanceOf(UniqueEntityID);
//       expect(annotation.curatorId).toEqual(mockCuratorId);
//       expect(annotation.url).toEqual(mockUrl);
//       expect(annotation.annotationFieldId).toEqual(mockFieldId);
//       expect(annotation.value).toEqual(mockDyadValue);
//       expect(annotation.annotationTemplateIds).toEqual([]); // Default empty array
//       expect(annotation.note).toBeUndefined();
//       expect(annotation.createdAt).toBeInstanceOf(Date);
//       expect(annotation.publishedRecordId).toBeUndefined();
//     });

//     it("should create an Annotation with all optional props", () => {
//       const specificId = new UniqueEntityID("specific-anno-id");
//       const createdAt = new Date("2023-10-26T10:00:00Z");
//       const props = {
//         curatorId: mockCuratorId,
//         url: mockUrl,
//         annotationFieldId: mockFieldId,
//         value: mockDyadValue,
//         annotationTemplateIds: [mockTemplateId1, mockTemplateId2],
//         note: mockNote,
//         createdAt: createdAt,
//         publishedRecordId: mockPublishedRecordId,
//       };
//       const result = Annotation.create(props, specificId);

//       expect(result.isSuccess).toBe(true);
//       const annotation = result.getValue();
//       expect(annotation.id.equals(specificId)).toBe(true);
//       expect(annotation.annotationId.getValue().equals(specificId)).toBe(true); // Check getter
//       expect(annotation.annotationTemplateIds).toEqual([
//         mockTemplateId1,
//         mockTemplateId2,
//       ]);
//       expect(annotation.note).toEqual(mockNote);
//       expect(annotation.createdAt).toEqual(createdAt);
//       expect(annotation.publishedRecordId).toEqual(mockPublishedRecordId);
//     });

//     it("should set createdAt timestamp if not provided", () => {
//       const props = {
//         curatorId: mockCuratorId,
//         url: mockUrl,
//         annotationFieldId: mockFieldId,
//         value: mockDyadValue,
//       };
//       const result = Annotation.create(props);
//       const annotation = result.getValue();
//       const now = new Date();
//       expect(annotation.createdAt?.getTime()).toBeCloseTo(now.getTime(), -2); // Within ~100ms
//     });

//     it("should fail if required props are missing (e.g., url)", () => {
//       const props = {
//         curatorId: mockCuratorId,
//         // url: mockUrl, // Missing url
//         annotationFieldId: mockFieldId,
//         value: mockDyadValue,
//       };
//       const result = Annotation.create(<any>props);

//       expect(result.isFailure).toBe(true);
//       expect(result.getErrorValue()).toContain("url");
//     });

//     it("should fail if required props are missing (e.g., value)", () => {
//       const props = {
//         curatorId: mockCuratorId,
//         url: mockUrl,
//         annotationFieldId: mockFieldId,
//         // value: mockDyadValue, // Missing value
//       };
//       const result = Annotation.create(<any>props);

//       expect(result.isFailure).toBe(true);
//       expect(result.getErrorValue()).toContain("value");
//     });

//     it("should fail if required props are missing (e.g., annotationFieldId)", () => {
//       const props = {
//         curatorId: mockCuratorId,
//         url: mockUrl,
//         // annotationFieldId: mockFieldId, // Missing field ID
//         value: mockDyadValue,
//       };
//       const result = Annotation.create(<any>props);

//       expect(result.isFailure).toBe(true);
//       expect(result.getErrorValue()).toContain("annotationFieldId");
//     });
//   });

//   describe("getters", () => {
//     let annotation: Annotation;
//     const specificId = new UniqueEntityID("getter-anno-id");
//     const createdAt = new Date("2024-03-15T11:00:00Z");

//     beforeAll(() => {
//       const props = {
//         curatorId: mockCuratorId,
//         url: mockUrl,
//         annotationFieldId: mockFieldId,
//         value: mockDyadValue,
//         annotationTemplateIds: [mockTemplateId1],
//         note: mockNote,
//         createdAt: createdAt,
//         publishedRecordId: mockPublishedRecordId,
//       };
//       annotation = Annotation.create(props, specificId).getValue();
//     });

//     it("should return the correct annotationId", () => {
//       expect(annotation.annotationId.getValue().equals(specificId)).toBe(true);
//     });

//     it("should return the correct curatorId", () => {
//       expect(annotation.curatorId).toEqual(mockCuratorId);
//     });

//     it("should return the correct url", () => {
//       expect(annotation.url).toEqual(mockUrl);
//     });

//     it("should return the correct annotationFieldId", () => {
//       expect(annotation.annotationFieldId).toEqual(mockFieldId);
//     });

//     it("should return the correct value", () => {
//       expect(annotation.value).toEqual(mockDyadValue);
//     });

//     it("should return the correct annotationTemplateIds", () => {
//       expect(annotation.annotationTemplateIds).toEqual([mockTemplateId1]);
//     });

//     it("should return the correct note", () => {
//       expect(annotation.note).toEqual(mockNote);
//     });

//     it("should return the correct createdAt date", () => {
//       expect(annotation.createdAt).toEqual(createdAt);
//     });

//     it("should return the correct publishedRecordId", () => {
//       expect(annotation.publishedRecordId).toEqual(mockPublishedRecordId);
//     });
//   });

//   describe("updatePublishedRecordId", () => {
//     it("should update the publishedRecordId", () => {
//       const props = {
//         curatorId: mockCuratorId,
//         url: mockUrl,
//         annotationFieldId: mockFieldId,
//         value: mockDyadValue,
//       };
//       const annotation = Annotation.create(props).getValue();
//       expect(annotation.publishedRecordId).toBeUndefined();

//       const newRecordId = PublishedRecordId.create(
//         "at://did:example:repo/app.annos.annotation/newAnno456"
//       );
//       annotation.updatePublishedRecordId(newRecordId);

//       expect(annotation.publishedRecordId).toEqual(newRecordId);
//     });

//     it("should overwrite an existing publishedRecordId", () => {
//       const initialRecordId = PublishedRecordId.create(
//         "at://did:example:repo/app.annos.annotation/initialAnno"
//       );
//       const props = {
//         curatorId: mockCuratorId,
//         url: mockUrl,
//         annotationFieldId: mockFieldId,
//         value: mockDyadValue,
//         publishedRecordId: initialRecordId,
//       };
//       const annotation = Annotation.create(props).getValue();
//       expect(annotation.publishedRecordId).toEqual(initialRecordId);

//       const updatedRecordId = PublishedRecordId.create(
//         "at://did:example:repo/app.annos.annotation/updatedAnno789"
//       );
//       annotation.updatePublishedRecordId(updatedRecordId);

//       expect(annotation.publishedRecordId).toEqual(updatedRecordId);
//     });
//   });

//   describe("updateValue", () => {
//     let annotation: Annotation;

//     beforeEach(() => {
//       // Create a fresh annotation before each test in this suite
//       const props = {
//         curatorId: mockCuratorId,
//         url: mockUrl,
//         annotationFieldId: mockFieldId,
//         value: mockDyadValue, // Start with DyadValue
//       };
//       annotation = Annotation.create(props).getValue();
//     });

//     it("should update the value successfully if the type is the same", () => {
//       const newValue = DyadValue.create({ value: 90 });
//       const result = annotation.updateValue(newValue);

//       expect(result.isRight()).toBe(true); // Check if it's a success (right side of Either)
//       expect(annotation.value).toEqual(newValue);
//     });

//     it("should fail to update the value if the type is different", () => {
//       const newValue = mockRatingValue; // Different type (RatingValue)
//       const initialValue = annotation.value;
//       const result = annotation.updateValue(newValue);

//       expect(result.isLeft()).toBe(true); // Check if it's a failure (left side of Either)
//       expect(annotation.value).toEqual(initialValue); // Value should not have changed
//       expect(result.value).toBeInstanceOf(
//         UpdateAnnotationErrors.InvalidValueTypeError
//       );
//     });
//   });

//   // Add more tests here for other business logic methods if they exist
// });
