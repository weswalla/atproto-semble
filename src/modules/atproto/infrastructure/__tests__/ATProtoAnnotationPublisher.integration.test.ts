import { ATProtoAnnotationPublisher } from "../publishers/ATProtoAnnotationPublisher";
import { ATProtoAnnotationFieldPublisher } from "../publishers/ATProtoAnnotationFieldPublisher";
import { ATProtoAnnotationTemplatePublisher } from "../publishers/ATProtoAnnotationTemplatePublisher";
import { ATProtoAnnotationsFromTemplatePublisher } from "../publishers/ATProtoAnnotationsFromTemplatePublisher";
import { PublishedRecordId } from "src/modules/annotations/domain/value-objects/PublishedRecordId";
import { AnnotationTemplateBuilder } from "src/modules/annotations/tests/utils/builders/AnnotationTemplateBuilder";
import { AnnotationFieldBuilder } from "src/modules/annotations/tests/utils/builders/AnnotationFieldBuilder";
import { AnnotationBuilder } from "src/modules/annotations/tests/utils/builders/AnnotationBuilder";
import { AnnotationField } from "src/modules/annotations/domain/aggregates";
import { AnnotationTemplate } from "src/modules/annotations/domain/aggregates/AnnotationTemplate";
import { URI } from "src/modules/annotations/domain/value-objects/URI";
import { AnnotationType } from "src/modules/annotations/domain/value-objects/AnnotationType";
import { AnnotationValueFactory } from "src/modules/annotations/domain/AnnotationValueFactory";
import { CuratorId } from "src/modules/cards/domain/value-objects/CuratorId";
import { AnnotationsFromTemplate } from "src/modules/annotations/domain/aggregates/AnnotationsFromTemplate";
import dotenv from "dotenv";
import { AppPasswordAgentService } from "./AppPasswordAgentService";

// Load environment variables from .env.test
dotenv.config({ path: ".env.test" });

describe.skip("ATProtoAnnotationsPublisher", () => {
  let annotationPublisher: ATProtoAnnotationPublisher;
  let annotationsFromTemplatePublisher: ATProtoAnnotationsFromTemplatePublisher;
  let fieldPublisher: ATProtoAnnotationFieldPublisher;
  let templatePublisher: ATProtoAnnotationTemplatePublisher;

  // Store published entities for cleanup
  let publishedFields: { field: AnnotationField; id: PublishedRecordId }[] = [];
  let publishedTemplate: {
    template: AnnotationTemplate;
    id: PublishedRecordId;
  } | null = null;
  let publishedAnnotationIds: PublishedRecordId[] = [];

  // Store simple test entities
  let simpleField: AnnotationField;
  let simpleTemplate: AnnotationTemplate;
  let simpleAnnotationId: PublishedRecordId | null = null;

  beforeAll(async () => {
    if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
      throw new Error(
        "BSKY_DID and BSKY_APP_PASSWORD must be set in .env.test"
      );
    }

    const agentService = new AppPasswordAgentService({
      did: process.env.BSKY_DID,
      password: process.env.BSKY_APP_PASSWORD,
    });

    annotationPublisher = new ATProtoAnnotationPublisher(agentService);
    annotationsFromTemplatePublisher =
      new ATProtoAnnotationsFromTemplatePublisher(agentService);
    fieldPublisher = new ATProtoAnnotationFieldPublisher(agentService);
    templatePublisher = new ATProtoAnnotationTemplatePublisher(agentService);
  });

  afterAll(async () => {
    // Skip cleanup if credentials are not available
    if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
      return;
    }

    // Clean up all published annotations
    for (const annotationId of publishedAnnotationIds) {
      await annotationPublisher.unpublish(annotationId);
    }

    // Clean up simple annotation if it exists
    if (simpleAnnotationId) {
      await annotationPublisher.unpublish(simpleAnnotationId);
    }

    // Clean up simple template if it exists
    if (simpleTemplate?.publishedRecordId) {
      await templatePublisher.unpublish(simpleTemplate.publishedRecordId);
    }

    // Clean up all published fields
    for (const { id } of publishedFields) {
      await fieldPublisher.unpublish(id);
    }

    // Clean up simple field if it exists
    if (simpleField?.publishedRecordId) {
      await fieldPublisher.unpublish(simpleField.publishedRecordId);
    }
  });

  it("should publish and unpublish a single annotation", async () => {
    // Skip test if credentials are not available
    if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
      console.warn("Skipping test: BSKY credentials not found in .env.test");
      return;
    }

    const curatorId = process.env.BSKY_DID;

    // 1. Create and publish a single field
    simpleField = new AnnotationFieldBuilder()
      .withCuratorId(curatorId)
      .withName("Simple Rating Field")
      .withDescription("A simple rating field for testing")
      .withRatingDefinition()
      .withCreatedAt(new Date())
      .buildOrThrow();

    const fieldPublishResult = await fieldPublisher.publish(simpleField);
    expect(fieldPublishResult.isOk()).toBe(true);

    if (fieldPublishResult.isOk()) {
      const publishedFieldId = fieldPublishResult.value;
      simpleField.markAsPublished(publishedFieldId);
      console.log(
        `Published field: ${simpleField.name.value} with ID: ${publishedFieldId.getValue().uri}`
      );
    }

    // 2. Create and publish a simple template with the field
    simpleTemplate = new AnnotationTemplateBuilder()
      .withCuratorId(curatorId)
      .withName("Simple Test Template")
      .withDescription("A simple template for testing")
      .withFields([simpleField], false) // Make field optional
      .withCreatedAt(new Date())
      .buildOrThrow();

    const templatePublishResult =
      await templatePublisher.publish(simpleTemplate);
    expect(templatePublishResult.isOk()).toBe(true);

    if (templatePublishResult.isOk()) {
      const publishedTemplateId = templatePublishResult.value;
      simpleTemplate.markAsPublished(publishedTemplateId);
      console.log(
        `Published template: ${simpleTemplate.name.value} with ID: ${publishedTemplateId.getValue().uri}`
      );
    }

    // 3. Create and publish a single annotation
    const testUrl = new URI("https://example.com/simple-test");

    // Create a rating annotation
    const ratingType = AnnotationType.create("rating");
    const ratingValueResult = AnnotationValueFactory.create({
      type: ratingType,
      valueInput: { rating: 5 }, // 5 out of 5 stars
    });
    expect(ratingValueResult.isOk()).toBe(true);

    const simpleAnnotation = new AnnotationBuilder()
      .withCuratorId(curatorId)
      .withUrl(testUrl.value)
      .withAnnotationField(simpleField)
      .withValue(ratingValueResult.unwrap())
      .withNote("This is a simple rating annotation test")
      .withCreatedAt(new Date())
      .buildOrThrow();

    const annotationPublishResult =
      await annotationPublisher.publish(simpleAnnotation);
    expect(annotationPublishResult.isOk()).toBe(true);

    if (annotationPublishResult.isOk()) {
      simpleAnnotationId = annotationPublishResult.value;
      simpleAnnotation.markAsPublished(simpleAnnotationId);
      console.log(
        `Published simple annotation with ID: ${simpleAnnotationId.getValue().uri}`
      );
    }

    // // 4. Test unpublishing the annotation
    if (simpleAnnotationId) {
      const unpublishResult =
        await annotationPublisher.unpublish(simpleAnnotationId);
      expect(unpublishResult.isOk()).toBe(true);

      // Set to null since we've already unpublished it
      simpleAnnotationId = null;
      console.log("Successfully unpublished the simple annotation");
    }
  }, 15000); // Shorter timeout for simpler test

  it("should publish and unpublish annotations of all types from a template", async () => {
    // Skip test if credentials are not available
    if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
      console.warn("Skipping test: BSKY credentials not found in .env.test");
      return;
    }

    const curatorId = process.env.BSKY_DID;

    // 1. Create and publish fields of all types
    const dyadField = new AnnotationFieldBuilder()
      .withCuratorId(curatorId)
      .withName("Dyad Field")
      .withDescription("A dyad field for testing")
      .withDyadDefinition({ sideA: "Agree", sideB: "Disagree" })
      .withCreatedAt(new Date())
      .withPublishedRecordId({
        uri: "at://did:plc:rlknsba2qldjkicxsmni3vyn/network.cosmik.annotationField/3lohln4bc672c",
        cid: "bafyreienwqqnfegi2wtgd4rekdofrmthsey5eixnjwwp337cmj65enajla",
      })
      .buildOrThrow();
    console.log("Dyad field created", JSON.stringify(dyadField));

    const triadField = new AnnotationFieldBuilder()
      .withCuratorId(curatorId)
      .withName("Triad Field")
      .withDescription("A triad field for testing")
      .withTriadDefinition({
        vertexA: "Good",
        vertexB: "Fast",
        vertexC: "Cheap",
      })
      .withCreatedAt(new Date())
      .withPublishedRecordId({
        uri: "at://did:plc:rlknsba2qldjkicxsmni3vyn/network.cosmik.annotationField/3lohln4bc672c",
        cid: "bafyreienwqqnfegi2wtgd4rekdofrmthsey5eixnjwwp337cmj65enajla",
      })
      .buildOrThrow();

    const ratingField = new AnnotationFieldBuilder()
      .withCuratorId(curatorId)
      .withName("Rating Field")
      .withDescription("A rating field for testing")
      .withRatingDefinition()
      .withCreatedAt(new Date())
      .withPublishedRecordId({
        uri: "at://did:plc:rlknsba2qldjkicxsmni3vyn/network.cosmik.annotationField/3lohln4bc672c",
        cid: "bafyreienwqqnfegi2wtgd4rekdofrmthsey5eixnjwwp337cmj65enajla",
      })
      .buildOrThrow();

    const singleSelectField = new AnnotationFieldBuilder()
      .withCuratorId(curatorId)
      .withName("Single Select Field")
      .withDescription("A single select field for testing")
      .withSingleSelectDefinition({
        options: ["Option 1", "Option 2", "Option 3"],
      })
      .withCreatedAt(new Date())
      .withPublishedRecordId({
        uri: "at://did:plc:rlknsba2qldjkicxsmni3vyn/network.cosmik.annotationField/3lohln4bc672c",
        cid: "bafyreienwqqnfegi2wtgd4rekdofrmthsey5eixnjwwp337cmj65enajla",
      })
      .buildOrThrow();

    const multiSelectField = new AnnotationFieldBuilder()
      .withCuratorId(curatorId)
      .withName("Multi Select Field")
      .withDescription("A multi select field for testing")
      .withMultiSelectDefinition({
        options: ["Tag 1", "Tag 2", "Tag 3", "Tag 4"],
      })
      .withCreatedAt(new Date())
      .withPublishedRecordId({
        uri: "at://did:plc:rlknsba2qldjkicxsmni3vyn/network.cosmik.annotationField/3lohln4bc672c",
        cid: "bafyreienwqqnfegi2wtgd4rekdofrmthsey5eixnjwwp337cmj65enajla",
      })
      .buildOrThrow();

    // Publish all fields
    const fields = [
      dyadField,
      triadField,
      ratingField,
      singleSelectField,
      multiSelectField,
    ];

    // 2. Create and publish a template with all fields
    const template = new AnnotationTemplateBuilder()
      .withCuratorId(curatorId)
      .withName("Complete Test Template")
      .withDescription("A template with all field types for testing")
      .withFields(fields, false) // Make fields optional
      .withCreatedAt(new Date())
      .withPublishedRecordId({
        uri: "at://did:plc:rlknsba2qldjkicxsmni3vyn/network.cosmik.annotationField/3lohln4bc672c",
        cid: "bafyreienwqqnfegi2wtgd4rekdofrmthsey5eixnjwwp337cmj65enajla",
      })
      .buildOrThrow();

    // 3. Create and publish annotations for each field type using AnnotationValueFactory
    const testUrl = new URI("https://example.com/test-page");

    // Create a dyad annotation using AnnotationValueFactory
    const dyadType = AnnotationType.create("dyad");
    const dyadValueResult = AnnotationValueFactory.create({
      type: dyadType,
      valueInput: { value: 75 }, // 75% towards sideB
    });
    expect(dyadValueResult.isOk()).toBe(true);

    const dyadAnnotation = new AnnotationBuilder()
      .withCuratorId(curatorId)
      .withUrl(testUrl.value)
      .withAnnotationField(dyadField)
      .withValue(dyadValueResult.unwrap())
      .withNote("This is a dyad annotation test")
      .withAnnotationTemplateIds([template.templateId.getStringValue()])
      .withCreatedAt(new Date())
      .buildOrThrow();

    // Create a triad annotation
    const triadType = AnnotationType.create("triad");
    const triadValueResult = AnnotationValueFactory.create({
      type: triadType,
      valueInput: { vertexA: 200, vertexB: 300, vertexC: 500 }, // Sum should be 1000
    });
    expect(triadValueResult.isOk()).toBe(true);

    const triadAnnotation = new AnnotationBuilder()
      .withCuratorId(curatorId)
      .withUrl(testUrl.value)
      .withAnnotationField(triadField)
      .withValue(triadValueResult.unwrap())
      .withNote("This is a triad annotation test")
      .withAnnotationTemplateIds([template.templateId.getStringValue()])
      .withCreatedAt(new Date())
      .buildOrThrow();

    // Create a rating annotation
    const ratingType = AnnotationType.create("rating");
    const ratingValueResult = AnnotationValueFactory.create({
      type: ratingType,
      valueInput: { rating: 4 }, // 4 out of 5 stars
    });
    expect(ratingValueResult.isOk()).toBe(true);

    const ratingAnnotation = new AnnotationBuilder()
      .withCuratorId(curatorId)
      .withUrl(testUrl.value)
      .withAnnotationField(ratingField)
      .withValue(ratingValueResult.unwrap())
      .withNote("This is a rating annotation test")
      .withAnnotationTemplateIds([template.templateId.getStringValue()])
      .withCreatedAt(new Date())
      .buildOrThrow();

    // Create a single select annotation
    const singleSelectType = AnnotationType.create("singleSelect");
    const singleSelectValueResult = AnnotationValueFactory.create({
      type: singleSelectType,
      valueInput: { option: "Option 2" },
    });
    expect(singleSelectValueResult.isOk()).toBe(true);

    const singleSelectAnnotation = new AnnotationBuilder()
      .withCuratorId(curatorId)
      .withUrl(testUrl.value)
      .withAnnotationField(singleSelectField)
      .withValue(singleSelectValueResult.unwrap())
      .withNote("This is a single select annotation test")
      .withAnnotationTemplateIds([template.templateId.getStringValue()])
      .withCreatedAt(new Date())
      .buildOrThrow();

    // Create a multi select annotation
    const multiSelectType = AnnotationType.MULTI_SELECT;
    const multiSelectValueResult = AnnotationValueFactory.create({
      type: multiSelectType,
      valueInput: { options: ["Tag 1", "Tag 3"] },
    });
    expect(multiSelectValueResult.isOk()).toBe(true);

    const multiSelectAnnotation = new AnnotationBuilder()
      .withCuratorId(curatorId)
      .withUrl(testUrl.value)
      .withAnnotationField(multiSelectField)
      .withValue(multiSelectValueResult.unwrap())
      .withNote("This is a multi select annotation test")
      .withAnnotationTemplateIds([template.templateId.getStringValue()])
      .withCreatedAt(new Date())
      .buildOrThrow();

    // Publish all annotations
    const annotations = [
      dyadAnnotation,
      triadAnnotation,
      ratingAnnotation,
      singleSelectAnnotation,
      multiSelectAnnotation,
    ];
    // 4. Create AnnotationsFromTemplate aggregate
    const curatorIdObj = CuratorId.create(curatorId).unwrap();
    const annotationsFromTemplate = AnnotationsFromTemplate.create({
      annotations: annotations,
      template: template,
      curatorId: curatorIdObj,
      createdAt: new Date(),
    });

    expect(annotationsFromTemplate.isOk()).toBe(true);

    // 5. Publish the annotations using the batch publisher
    const batchPublishResult = await annotationsFromTemplatePublisher.publish(
      annotationsFromTemplate.unwrap()
    );

    expect(batchPublishResult.isOk()).toBe(true);

    if (batchPublishResult.isOk()) {
      const publishedRecordIds = batchPublishResult.value;

      // Mark annotations as published
      annotationsFromTemplate
        .unwrap()
        .markAllAnnotationsAsPublished(publishedRecordIds);

      // Store the published record IDs for cleanup
      for (const [_, recordId] of publishedRecordIds) {
        publishedAnnotationIds.push(recordId);
        console.log(
          `Published batch annotation with ID: ${recordId.getValue().uri}`
        );
      }

      // 6. Test unpublishing the annotations
      const unpublishResult = await annotationsFromTemplatePublisher.unpublish(
        Array.from(publishedRecordIds.values())
      );

      expect(unpublishResult.isOk()).toBe(true);
      console.log("Successfully unpublished batch annotations");

      // Remove from cleanup list since we've already unpublished them
      publishedAnnotationIds = [];
    }
  }, 30000); // Increase timeout for network requests
});
