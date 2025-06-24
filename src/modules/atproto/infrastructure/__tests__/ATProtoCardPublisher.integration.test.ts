import { ATProtoCardPublisher } from "../publishers/ATProtoCardPublisher";
import { PublishedRecordId } from "src/modules/cards/domain/value-objects/PublishedRecordId";
import { CardBuilder } from "src/modules/cards/tests/utils/builders/CardBuilder";
import { Card } from "src/modules/cards/domain/Card";
import { CardTypeEnum } from "src/modules/cards/domain/value-objects/CardType";
import { URL } from "src/modules/cards/domain/value-objects/URL";
import { UrlMetadata } from "src/modules/cards/domain/value-objects/UrlMetadata";
import dotenv from "dotenv";
import { AppPasswordAgentService } from "./AppPasswordAgentService";

// Load environment variables from .env.test
dotenv.config({ path: ".env.test" });

describe("ATProtoCardPublisher", () => {
  let publisher: ATProtoCardPublisher;
  let publishedCardIds: PublishedRecordId[] = [];

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

    publisher = new ATProtoCardPublisher(agentService);
  });

  afterAll(async () => {
    // Skip cleanup if credentials are not available
    if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
      return;
    }

    // Clean up all published cards
    for (const cardId of publishedCardIds) {
      try {
        await publisher.unpublish(cardId);
        console.log(`Cleaned up card: ${cardId.getValue().uri}`);
      } catch (error) {
        console.warn(`Failed to clean up card: ${error}`);
      }
    }
  });

  describe("URL Card Publishing", () => {
    it("should publish and unpublish a URL card", async () => {
      // Skip test if credentials are not available
      if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
        console.warn("Skipping test: BSKY credentials not found in .env.test");
        return;
      }

      const curatorId = process.env.BSKY_DID;
      const testUrl = URL.create("https://example.com/test-article").unwrap();

      // Create URL metadata
      const metadata = UrlMetadata.create({
        url: testUrl.value,
        title: "Test Article",
        description: "A test article for card publishing",
        author: "Test Author",
        siteName: "Example.com",
        type: "article",
        retrievedAt: new Date(),
      }).unwrap();

      // Create a URL card
      const urlCard = new CardBuilder()
        .withCuratorId(curatorId)
        .withUrlCard(testUrl, metadata)
        .withUrl(testUrl) // Set the required URL property
        .buildOrThrow();

      // 1. Publish the card
      const publishResult = await publisher.publish(urlCard);
      expect(publishResult.isOk()).toBe(true);

      if (publishResult.isOk()) {
        const publishedRecordId = publishResult.value;
        publishedCardIds.push(publishedRecordId);

        // Mark card as published
        urlCard.markAsPublished(publishedRecordId);
        expect(urlCard.isPublished).toBe(true);

        // 2. Test updating the card
        const updateResult = await publisher.publish(urlCard);
        expect(updateResult.isOk()).toBe(true);

        if (updateResult.isOk()) {
          expect(updateResult.value).toBe(publishedRecordId);
          console.log(`Updated URL card: ${publishedRecordId.getValue().uri}`);
        }

        // 3. Unpublish the card
        const unpublishResult = await publisher.unpublish(publishedRecordId);
        expect(unpublishResult.isOk()).toBe(true);

        console.log("Successfully unpublished URL card");

        // Remove from cleanup list since we've already unpublished it
        publishedCardIds = publishedCardIds.filter(
          (id) => id !== publishedRecordId
        );
      }
    }, 15000);
  });

  describe("Note Card Publishing", () => {
    it("should publish and unpublish a note card", async () => {
      // Skip test if credentials are not available
      if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
        console.warn("Skipping test: BSKY credentials not found in .env.test");
        return;
      }

      const curatorId = process.env.BSKY_DID;

      // Create a note card
      const noteCard = new CardBuilder()
        .withCuratorId(curatorId)
        .withNoteCard("This is a test note for publishing", "Test Note Title")
        .buildOrThrow();

      // 1. Publish the card
      const publishResult = await publisher.publish(noteCard);
      expect(publishResult.isOk()).toBe(true);

      if (publishResult.isOk()) {
        const publishedRecordId = publishResult.value;
        publishedCardIds.push(publishedRecordId);

        console.log(`Published note card: ${publishedRecordId.getValue().uri}`);

        // Mark card as published
        noteCard.markAsPublished(publishedRecordId);
        expect(noteCard.isPublished).toBe(true);

        // 2. Unpublish the card
        const unpublishResult = await publisher.unpublish(publishedRecordId);
        expect(unpublishResult.isOk()).toBe(true);

        console.log("Successfully unpublished note card");

        // Remove from cleanup list since we've already unpublished it
        publishedCardIds = publishedCardIds.filter(
          (id) => id !== publishedRecordId
        );
      }
    }, 15000);
  });

  describe("Note Card with URL Publishing", () => {
    it("should publish a note card with optional URL", async () => {
      // Skip test if credentials are not available
      if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
        console.warn("Skipping test: BSKY credentials not found in .env.test");
        return;
      }

      const curatorId = process.env.BSKY_DID;
      const referenceUrl = URL.create("https://example.com/reference").unwrap();

      // Create a note card with optional URL
      const noteCard = new CardBuilder()
        .withCuratorId(curatorId)
        .withNoteCard("This note references a URL", "Note with URL")
        .withUrl(referenceUrl)
        .buildOrThrow();

      // 1. Publish the card
      const publishResult = await publisher.publish(noteCard);
      expect(publishResult.isOk()).toBe(true);

      if (publishResult.isOk()) {
        const publishedRecordId = publishResult.value;
        publishedCardIds.push(publishedRecordId);

        console.log(
          `Published note card with URL: ${publishedRecordId.getValue().uri}`
        );

        // Verify the card has the URL
        expect(noteCard.url).toBe(referenceUrl);

        // 2. Unpublish the card
        const unpublishResult = await publisher.unpublish(publishedRecordId);
        expect(unpublishResult.isOk()).toBe(true);

        console.log("Successfully unpublished note card with URL");

        // Remove from cleanup list since we've already unpublished it
        publishedCardIds = publishedCardIds.filter(
          (id) => id !== publishedRecordId
        );
      }
    }, 15000);
  });

  describe("Error Handling", () => {
    it("should handle authentication errors gracefully", async () => {
      // Create a publisher with invalid credentials
      const invalidAgentService = new AppPasswordAgentService({
        did: "did:plc:invalid",
        password: "invalid-password",
      });

      const invalidPublisher = new ATProtoCardPublisher(invalidAgentService);

      const testCard = new CardBuilder()
        .withCuratorId("did:plc:invalid")
        .withNoteCard("Test note")
        .buildOrThrow();

      const result = await invalidPublisher.publish(testCard);
      expect(result.isErr()).toBe(true);

      if (result.isErr()) {
        expect(result.error.message).toMatch(/authentication|error/i);
      }
    }, 10000);

    it("should handle invalid record IDs for unpublishing", async () => {
      // Skip test if credentials are not available
      if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
        console.warn("Skipping test: BSKY credentials not found in .env.test");
        return;
      }

      const invalidRecordId = PublishedRecordId.create({
        uri: "at://did:plc:invalid/network.cosmik.card/invalid",
        cid: "bafyinvalid",
      });

      const result = await publisher.unpublish(invalidRecordId);
      expect(result.isErr()).toBe(true);
    }, 10000);
  });
});
