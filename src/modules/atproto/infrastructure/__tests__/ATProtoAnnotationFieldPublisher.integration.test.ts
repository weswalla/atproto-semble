import { ATProtoAnnotationFieldPublisher } from "../publishers/ATProtoAnnotationFieldPublisher";
import { PublishedRecordId } from "src/modules/cards/domain/value-objects/PublishedRecordId";
import { AnnotationFieldBuilder } from "src/modules/annotations/tests/utils/builders/AnnotationFieldBuilder";
import dotenv from "dotenv";
import { AppPasswordAgentService } from "./AppPasswordAgentService";

// Load environment variables from .env.test
dotenv.config({ path: ".env.test" });

describe.skip("ATProtoAnnotationFieldPublisher", () => {
  let publisher: ATProtoAnnotationFieldPublisher;
  let publishedRecordId: PublishedRecordId;

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

    publisher = new ATProtoAnnotationFieldPublisher(agentService);
  });

  it("should publish and unpublish an annotation field", async () => {
    // Skip test if credentials are not available
    if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
      console.warn("Skipping test: BSKY credentials not found in .env.test");
      return;
    }

    // Create a test field with a dyad definition
    const testField = new AnnotationFieldBuilder()
      .withCuratorId(process.env.BSKY_DID)
      .withName("Test Annotation Field")
      .withDescription("A test field created for integration testing")
      .withDyadDefinition({ sideA: "Agree", sideB: "Disagree" })
      .withCreatedAt(new Date())
      .buildOrThrow();

    // 1. Publish the field
    const publishResult = await publisher.publish(testField);
    expect(publishResult.isOk()).toBe(true);

    if (publishResult.isOk()) {
      publishedRecordId = publishResult.value;
      console.log(`Published record: ${publishedRecordId.getValue()}`);

      // 2. Unpublish the field
      const unpublishResult = await publisher.unpublish(publishedRecordId);
      expect(unpublishResult.isOk()).toBe(true);
    }
  }, 10000); // Increase timeout for network requests
});
