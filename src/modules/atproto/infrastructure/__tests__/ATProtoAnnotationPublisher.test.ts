import { ATProtoAnnotationPublisher } from "../ATProtoAnnotationPublisher";
import { ATProtoAnnotationFieldPublisher } from "../ATProtoAnnotationFieldPublisher";
import { ATProtoAnnotationTemplatePublisher } from "../ATProtoAnnotationTemplatePublisher";
import { PublishedRecordId } from "src/modules/annotations/domain/value-objects/PublishedRecordId";
import { AtpAgent } from "@atproto/api";
import { AnnotationTemplateBuilder } from "src/modules/annotations/tests/utils/builders/AnnotationTemplateBuilder";
import { AnnotationFieldBuilder } from "src/modules/annotations/tests/utils/builders/AnnotationFieldBuilder";
import { AnnotationBuilder } from "src/modules/annotations/tests/utils/builders/AnnotationBuilder";
import { AnnotationField } from "src/modules/annotations/domain/aggregates";
import { AnnotationTemplate } from "src/modules/annotations/domain/aggregates/AnnotationTemplate";
import { URI } from "src/modules/annotations/domain/value-objects/URI";
import { AnnotationType } from "src/modules/annotations/domain/value-objects/AnnotationType";
import { AnnotationValueFactory } from "src/modules/annotations/domain/AnnotationValueFactory";
import dotenv from "dotenv";

// Load environment variables from .env.test
dotenv.config({ path: ".env.test" });

describe.skip("ATProtoAnnotationPublisher", () => {
  let annotationPublisher: ATProtoAnnotationPublisher;
  let fieldPublisher: ATProtoAnnotationFieldPublisher;
  let templatePublisher: ATProtoAnnotationTemplatePublisher;
  let agent: AtpAgent;

  // Store published entities for cleanup
  let publishedFields: { field: AnnotationField; id: PublishedRecordId }[] = [];
  let publishedTemplate: {
    template: AnnotationTemplate;
    id: PublishedRecordId;
  } | null = null;
  let publishedAnnotationIds: PublishedRecordId[] = [];

  beforeAll(async () => {
    // Skip test if credentials are not available
    if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
      console.warn("Skipping test: BSKY credentials not found in .env.test");
      return;
    }

    // Create and authenticate the agent
    agent = new AtpAgent({
      service: "https://bsky.social",
    });

    // Sign in with credentials from environment variables
    await agent.login({
      identifier: process.env.BSKY_DID!,
      password: process.env.BSKY_APP_PASSWORD!,
    });

    annotationPublisher = new ATProtoAnnotationPublisher(agent);
    fieldPublisher = new ATProtoAnnotationFieldPublisher(agent);
    templatePublisher = new ATProtoAnnotationTemplatePublisher(agent);
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

    // Clean up the published template
    if (publishedTemplate) {
      await templatePublisher.unpublish(publishedTemplate.id);
    }

    // Clean up all published fields
    for (const { id } of publishedFields) {
      await fieldPublisher.unpublish(id);
    }
  });

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
      .buildOrThrow();

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
      .buildOrThrow();

    const ratingField = new AnnotationFieldBuilder()
      .withCuratorId(curatorId)
      .withName("Rating Field")
      .withDescription("A rating field for testing")
      .withRatingDefinition()
      .withCreatedAt(new Date())
      .buildOrThrow();

    const singleSelectField = new AnnotationFieldBuilder()
      .withCuratorId(curatorId)
      .withName("Single Select Field")
      .withDescription("A single select field for testing")
      .withSingleSelectDefinition({
        options: ["Option 1", "Option 2", "Option 3"],
      })
      .withCreatedAt(new Date())
      .buildOrThrow();

    const multiSelectField = new AnnotationFieldBuilder()
      .withCuratorId(curatorId)
      .withName("Multi Select Field")
      .withDescription("A multi select field for testing")
      .withMultiSelectDefinition({
        options: ["Tag 1", "Tag 2", "Tag 3", "Tag 4"],
      })
      .withCreatedAt(new Date())
      .buildOrThrow();

    // Publish all fields
    const fields = [
      dyadField,
      triadField,
      ratingField,
      singleSelectField,
      multiSelectField,
    ];

    for (const field of fields) {
      const fieldPublishResult = await fieldPublisher.publish(field);
      expect(fieldPublishResult.isOk()).toBe(true);

      if (fieldPublishResult.isOk()) {
        const publishedFieldId = fieldPublishResult.value;
        field.markAsPublished(publishedFieldId);
        publishedFields.push({ field, id: publishedFieldId });
        console.log(
          `Published field: ${field.name.value} with ID: ${publishedFieldId.getValue().uri}`
        );
      }
    }

    // 2. Create and publish a template with all fields
    const template = new AnnotationTemplateBuilder()
      .withCuratorId(curatorId)
      .withName("Complete Test Template")
      .withDescription("A template with all field types for testing")
      .withFields(fields, false) // Make fields optional
      .withCreatedAt(new Date())
      .buildOrThrow();

    const templatePublishResult = await templatePublisher.publish(template);
    expect(templatePublishResult.isOk()).toBe(true);

    if (templatePublishResult.isOk()) {
      const publishedTemplateId = templatePublishResult.value;
      template.markAsPublished(publishedTemplateId);
      publishedTemplate = { template, id: publishedTemplateId };
      console.log(
        `Published template: ${template.name.value} with ID: ${publishedTemplateId.getValue().uri}`
      );
    }

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
      .withAnnotationFieldId(dyadField.fieldId.getStringValue())
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
      .withAnnotationFieldId(triadField.fieldId.getStringValue())
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
      .withAnnotationFieldId(ratingField.fieldId.getStringValue())
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
      .withAnnotationFieldId(singleSelectField.fieldId.getStringValue())
      .withValue(singleSelectValueResult.unwrap())
      .withNote("This is a single select annotation test")
      .withAnnotationTemplateIds([template.templateId.getStringValue()])
      .withCreatedAt(new Date())
      .buildOrThrow();

    // Create a multi select annotation
    const multiSelectType = AnnotationType.create("multiSelect");
    const multiSelectValueResult = AnnotationValueFactory.create({
      type: multiSelectType,
      valueInput: { options: ["Tag 1", "Tag 3"] },
    });
    expect(multiSelectValueResult.isOk()).toBe(true);

    const multiSelectAnnotation = new AnnotationBuilder()
      .withCuratorId(curatorId)
      .withUrl(testUrl.value)
      .withAnnotationFieldId(multiSelectField.fieldId.getStringValue())
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

    for (const annotation of annotations) {
      const annotationPublishResult =
        await annotationPublisher.publish(annotation);
      expect(annotationPublishResult.isOk()).toBe(true);

      if (annotationPublishResult.isOk()) {
        const publishedAnnotationId = annotationPublishResult.value;
        annotation.markAsPublished(publishedAnnotationId);
        publishedAnnotationIds.push(publishedAnnotationId);
        console.log(
          `Published annotation with ID: ${publishedAnnotationId.getValue().uri}`
        );
      }
    }

    // 4. Test unpublishing one annotation
    if (publishedAnnotationIds.length > 0) {
      const idToUnpublish = publishedAnnotationIds[0];
      const unpublishResult = await annotationPublisher.unpublish(
        idToUnpublish!
      );
      expect(unpublishResult.isOk()).toBe(true);

      // Remove from the cleanup list
      publishedAnnotationIds.shift();
    }
  }, 30000); // Increase timeout for network requests
});
