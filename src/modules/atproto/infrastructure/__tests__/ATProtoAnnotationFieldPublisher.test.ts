import { ATProtoAnnotationFieldPublisher } from "../ATProtoAnnotationFieldPublisher";
import { PublishedRecordId } from "src/modules/annotations/domain/value-objects/PublishedRecordId";
import { BskyAgent } from "@atproto/api";
import { AnnotationFieldBuilder } from "src/modules/annotations/tests/utils/builders/AnnotationFieldBuilder";
import dotenv from "dotenv";

// Load environment variables from .env.test
dotenv.config({ path: ".env.test" });

describe("ATProtoAnnotationFieldPublisher", () => {
  let publisher: ATProtoAnnotationFieldPublisher;
  let agent: BskyAgent;
  let publishedRecordId: PublishedRecordId;
  
  beforeAll(async () => {
    // Create and authenticate the agent
    agent = new BskyAgent({
      service: "https://bsky.social"
    });
    
    // Sign in with credentials from environment variables
    await agent.login({
      identifier: process.env.BSKY_DID!,
      password: process.env.BSKY_APP_PASSWORD!
    });
    
    publisher = new ATProtoAnnotationFieldPublisher(agent);
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
