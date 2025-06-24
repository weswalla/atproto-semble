import { ATProtoAnnotationTemplatePublisher } from "../publishers/ATProtoAnnotationTemplatePublisher";
import { ATProtoAnnotationFieldPublisher } from "../publishers/ATProtoAnnotationFieldPublisher";
import { PublishedRecordId } from "src/modules/annotations/domain/value-objects/PublishedRecordId";
import { AnnotationTemplateBuilder } from "src/modules/annotations/tests/utils/builders/AnnotationTemplateBuilder";
import { AnnotationFieldBuilder } from "src/modules/annotations/tests/utils/builders/AnnotationFieldBuilder";
import dotenv from "dotenv";
import { AppPasswordAgentService } from "./AppPasswordAgentService";

// Load environment variables from .env.test
dotenv.config({ path: ".env.test" });

describe.skip("ATProtoAnnotationTemplatePublisher", () => {
  let templatePublisher: ATProtoAnnotationTemplatePublisher;
  let fieldPublisher: ATProtoAnnotationFieldPublisher;
  let publishedFieldId: PublishedRecordId;
  let publishedTemplateId: PublishedRecordId;

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

    templatePublisher = new ATProtoAnnotationTemplatePublisher(agentService);
    fieldPublisher = new ATProtoAnnotationFieldPublisher(agentService);
  });

  it("should publish and unpublish an annotation template", async () => {
    // Skip test if credentials are not available
    if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
      console.warn("Skipping test: BSKY credentials not found in .env.test");
      return;
    }

    // 1. First publish a field to use in the template
    const testField = new AnnotationFieldBuilder()
      .withCuratorId(process.env.BSKY_DID)
      .withName("Test Field for Template")
      .withDescription("A test field created for template testing")
      .withDyadDefinition({ sideA: "Agree", sideB: "Disagree" })
      .withCreatedAt(new Date())
      .buildOrThrow();

    const fieldPublishResult = await fieldPublisher.publish(testField);
    expect(fieldPublishResult.isOk()).toBe(true);

    if (fieldPublishResult.isOk()) {
      publishedFieldId = fieldPublishResult.value;
      console.log(`Published field: ${publishedFieldId.getValue()}`);

      // Mark the field as published
      testField.markAsPublished(publishedFieldId);

      // 2. Now create and publish a template that uses this field
      const testTemplate = new AnnotationTemplateBuilder()
        .withCuratorId(process.env.BSKY_DID)
        .withName("Test Template")
        .withDescription("A test template for integration testing")
        .withFields([testField], true) // Pass true to make the field required
        .withCreatedAt(new Date())
        .buildOrThrow();

      const templatePublishResult =
        await templatePublisher.publish(testTemplate);
      expect(templatePublishResult.isOk()).toBe(true);

      if (templatePublishResult.isOk()) {
        publishedTemplateId = templatePublishResult.value;
        console.log(`Published template: ${publishedTemplateId.getValue()}`);

        // 3. Unpublish the template
        const unpublishTemplateResult =
          await templatePublisher.unpublish(publishedTemplateId);
        expect(unpublishTemplateResult.isOk()).toBe(true);

        // 4. Unpublish the field
        const unpublishFieldResult =
          await fieldPublisher.unpublish(publishedFieldId);
        expect(unpublishFieldResult.isOk()).toBe(true);
      }
    }
  }, 15000); // Increase timeout for network requests

  it("should reject publishing a template with unpublished fields", async () => {
    // Skip test if credentials are not available
    if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
      console.warn("Skipping test: BSKY credentials not found in .env.test");
      return;
    }

    // Create an unpublished field
    const unpublishedField = new AnnotationFieldBuilder()
      .withCuratorId(process.env.BSKY_DID)
      .withName("Unpublished Field")
      .withDescription("This field has not been published")
      .withDyadDefinition({ sideA: "Yes", sideB: "No" })
      .withCreatedAt(new Date())
      .buildOrThrow();

    // Create a template with the unpublished field
    const templateWithUnpublishedField = new AnnotationTemplateBuilder()
      .withCuratorId(process.env.BSKY_DID)
      .withName("Invalid Template")
      .withDescription("Template with unpublished fields")
      .withFields([unpublishedField], false) // Pass false to make the field optional
      .withCreatedAt(new Date())
      .buildOrThrow();

    // Try to publish the template
    const result = await templatePublisher.publish(
      templateWithUnpublishedField
    );

    // Should fail because the field is not published
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("All fields must be published");
    }
  }, 10000);
});
