import { AnnotationBuilder } from "../utils/builders/AnnotationBuilder";
import { AnnotationFieldBuilder } from "../utils/builders/AnnotationFieldBuilder";
import {
  DyadValue,
  TriadValue,
  RatingValue,
  SingleSelectValue,
  MultiSelectValue,
} from "../../domain/value-objects/AnnotationValue";
import { UniqueEntityID } from "../../../../shared/domain/UniqueEntityID";

describe("AnnotationBuilder", () => {
  let curatorId: string;
  let url: string;

  beforeEach(() => {
    curatorId = "did:plc:testcurator123";
    url = "https://example.com/resource";
  });

  it("should build a dyad annotation correctly", () => {
    // Create a dyad field
    const dyadField = new AnnotationFieldBuilder()
      .withName("Dyad Test Field")
      .withDescription("A test dyad field")
      .withDyadDefinition({
        sideA: "Left Side",
        sideB: "Right Side",
      })
      .buildOrThrow();

    // Build the annotation
    const annotation = new AnnotationBuilder()
      .withCuratorId(curatorId)
      .withUrl(url)
      .withAnnotationField(dyadField)
      .withDyadValue(75) // Value between sides
      .withNote("This is a dyad annotation test")
      .buildOrThrow();

    // Verify the annotation
    expect(annotation.curatorId.value).toBe(curatorId);
    expect(annotation.url.value).toBe(url);
    expect(annotation.annotationField.fieldId).toEqual(dyadField.fieldId);
    expect(annotation.value).toBeInstanceOf(DyadValue);
    expect((annotation.value as DyadValue).value).toBe(75);
    expect(annotation.note?.getValue()).toBe("This is a dyad annotation test");
  });

  it("should build a triad annotation correctly", () => {
    // Create a triad field
    const triadField = new AnnotationFieldBuilder()
      .withName("Triad Test Field")
      .withDescription("A test triad field")
      .withTriadDefinition({
        vertexA: "Vertex A",
        vertexB: "Vertex B",
        vertexC: "Vertex C",
      })
      .buildOrThrow();

    // Build the annotation
    const annotation = new AnnotationBuilder()
      .withCuratorId(curatorId)
      .withUrl(url)
      .withAnnotationField(triadField)
      .withTriadValue({
        vertexA: 300,
        vertexB: 400,
        vertexC: 300,
      })
      .buildOrThrow();

    // Verify the annotation
    expect(annotation.value).toBeInstanceOf(TriadValue);
    expect((annotation.value as TriadValue).vertexA).toBe(300);
    expect((annotation.value as TriadValue).vertexB).toBe(400);
    expect((annotation.value as TriadValue).vertexC).toBe(300);
  });

  it("should build a rating annotation correctly", () => {
    // Create a rating field
    const ratingField = new AnnotationFieldBuilder()
      .withName("Rating Test Field")
      .withDescription("A test rating field")
      .withRatingDefinition()
      .buildOrThrow();

    // Build the annotation
    const annotation = new AnnotationBuilder()
      .withCuratorId(curatorId)
      .withUrl(url)
      .withAnnotationField(ratingField)
      .withRatingValue(4)
      .buildOrThrow();

    // Verify the annotation
    expect(annotation.value).toBeInstanceOf(RatingValue);
    expect((annotation.value as RatingValue).rating).toBe(4);
  });

  it("should build a single select annotation correctly", () => {
    // Create a single select field
    const singleSelectField = new AnnotationFieldBuilder()
      .withName("Single Select Test Field")
      .withDescription("A test single select field")
      .withSingleSelectDefinition({
        options: ["Option A", "Option B", "Option C"],
      })
      .buildOrThrow();

    // Build the annotation
    const annotation = new AnnotationBuilder()
      .withCuratorId(curatorId)
      .withUrl(url)
      .withAnnotationField(singleSelectField)
      .withSingleSelectValue("Option B")
      .buildOrThrow();

    // Verify the annotation
    expect(annotation.value).toBeInstanceOf(SingleSelectValue);
    expect((annotation.value as SingleSelectValue).option).toBe("Option B");
  });

  it("should build a multi select annotation correctly", () => {
    // Create a multi select field
    const multiSelectField = new AnnotationFieldBuilder()
      .withName("Multi Select Test Field")
      .withDescription("A test multi select field")
      .withMultiSelectDefinition({
        options: ["Option A", "Option B", "Option C", "Option D"],
      })
      .buildOrThrow();

    // Build the annotation
    const annotation = new AnnotationBuilder()
      .withCuratorId(curatorId)
      .withUrl(url)
      .withAnnotationField(multiSelectField)
      .withMultiSelectValue(["Option A", "Option C"])
      .buildOrThrow();

    // Verify the annotation
    expect(annotation.value).toBeInstanceOf(MultiSelectValue);
    expect((annotation.value as MultiSelectValue).options).toEqual([
      "Option A",
      "Option C",
    ]);
  });

  it("should include annotation template IDs when provided", () => {
    const dyadField = new AnnotationFieldBuilder()
      .withName("Dyad Field")
      .withDescription("A dyad field")
      .withDyadDefinition({
        sideA: "Left",
        sideB: "Right",
      })
      .buildOrThrow();

    const templateId = new UniqueEntityID("template-123");

    const annotation = new AnnotationBuilder()
      .withCuratorId(curatorId)
      .withUrl(url)
      .withAnnotationField(dyadField)
      .withDyadValue(50)
      .withAnnotationTemplateId("template-123")
      .buildOrThrow();

    expect(annotation.annotationTemplateIds).toBeDefined();
    expect(annotation.annotationTemplateIds?.length).toBe(1);
    expect(annotation.annotationTemplateIds?.[0]?.getValue().toString()).toBe(
      "template-123"
    );
  });

  it("should set published record ID when provided", () => {
    const dyadField = new AnnotationFieldBuilder()
      .withName("Dyad Field")
      .withDescription("A dyad field")
      .withDyadDefinition({
        sideA: "Left",
        sideB: "Right",
      })
      .buildOrThrow();

    const publishedRecordId = {
      uri: "at://did:plc:testcurator123/app.annos.annotation/123",
      cid: "bafyreihykqbv6tqzolnlvj5zlksndo6wd6earqaipnpfjazxmcnbzylnxe",
    };

    const annotation = new AnnotationBuilder()
      .withCuratorId(curatorId)
      .withUrl(url)
      .withAnnotationField(dyadField)
      .withDyadValue(50)
      .withPublishedRecordId(publishedRecordId)
      .buildOrThrow();

    expect(annotation.publishedRecordId).toBeDefined();
    expect(annotation.publishedRecordId?.uri).toBe(publishedRecordId.uri);
    expect(annotation.publishedRecordId?.cid).toBe(publishedRecordId.cid);
  });

  it("should fail when trying to build without providing an annotation field", () => {
    const builder = new AnnotationBuilder()
      .withCuratorId(curatorId)
      .withUrl(url)
      .withDyadValue(50);

    const result = builder.build();
    expect(result.isErr()).toBe(true);
  });

  it("should fail when value type does not match field type", () => {
    const dyadField = new AnnotationFieldBuilder()
      .withName("Dyad Field")
      .withDescription("A dyad field")
      .withDyadDefinition({
        sideA: "Left",
        sideB: "Right",
      })
      .buildOrThrow();

    const builder = new AnnotationBuilder()
      .withCuratorId(curatorId)
      .withUrl(url)
      .withAnnotationField(dyadField)
      .withRatingValue(4); // Mismatch: using rating value with dyad field

    const result = builder.build();
    expect(result.isErr()).toBe(true);
  });
});
