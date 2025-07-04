import { ATProtoCardPublisher } from "../publishers/ATProtoCardPublisher";
import { CardBuilder } from "src/modules/cards/tests/utils/builders/CardBuilder";
import { URL } from "src/modules/cards/domain/value-objects/URL";
import { UrlMetadata } from "src/modules/cards/domain/value-objects/UrlMetadata";
import { CuratorId } from "src/modules/cards/domain/value-objects/CuratorId";
import dotenv from "dotenv";
import { AppPasswordAgentService } from "./AppPasswordAgentService";
import { PublishedRecordId } from "src/modules/cards/domain/value-objects/PublishedRecordId";

// Load environment variables from .env.test
dotenv.config({ path: ".env.test" });

describe("ATProtoCardPublisher", () => {
  let publisher: ATProtoCardPublisher;
  let curatorId: CuratorId;
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
    curatorId = CuratorId.create(process.env.BSKY_DID).unwrap();
  });

  afterAll(async () => {
    // Skip cleanup if credentials are not available
    if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
      return;
    }

    // Clean up all published cards
    for (const cardId of publishedCardIds) {
      try {
        await publisher.unpublishCardFromLibrary(cardId, curatorId);
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
        .withCuratorId(curatorId.value)
        .withUrlCard(testUrl, metadata)
        .withUrl(testUrl) // Set the required URL property
        .buildOrThrow();

      // Add card to curator's library first
      urlCard.addToLibrary(curatorId);

      // 1. Publish the card
      const publishResult = await publisher.publishCardToLibrary(
        urlCard,
        curatorId
      );
      expect(publishResult.isOk()).toBe(true);

      if (publishResult.isOk()) {
        const publishedRecordId = publishResult.value;
        publishedCardIds.push(publishedRecordId);

        // Mark card as published in library
        urlCard.markCardInLibraryAsPublished(curatorId, publishedRecordId);
        expect(urlCard.isInLibrary(curatorId)).toBe(true);

        // 2. Test updating the card
        const updateResult = await publisher.publishCardToLibrary(
          urlCard,
          curatorId
        );
        expect(updateResult.isOk()).toBe(true);

        if (updateResult.isOk()) {
          expect(updateResult.value).toBe(publishedRecordId);
          console.log(`Updated URL card: ${publishedRecordId.getValue().uri}`);
        }

        // 3. Unpublish the card
        const unpublishResult = await publisher.unpublishCardFromLibrary(
          publishedRecordId,
          curatorId
        );
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

      // Create a note card
      const noteCard = new CardBuilder()
        .withCuratorId(curatorId.value)
        .withNoteCard("This is a test note for publishing", "Test Note Title")
        .buildOrThrow();

      // Add card to curator's library first
      noteCard.addToLibrary(curatorId);

      // 1. Publish the card
      const publishResult = await publisher.publishCardToLibrary(
        noteCard,
        curatorId
      );
      expect(publishResult.isOk()).toBe(true);

      if (publishResult.isOk()) {
        const publishedRecordId = publishResult.value;
        publishedCardIds.push(publishedRecordId);

        console.log(`Published note card: ${publishedRecordId.getValue().uri}`);

        // Mark card as published in library
        noteCard.markCardInLibraryAsPublished(curatorId, publishedRecordId);
        expect(noteCard.isInLibrary(curatorId)).toBe(true);

        // 2. Unpublish the card
        const unpublishResult = await publisher.unpublishCardFromLibrary(
          publishedRecordId,
          curatorId
        );
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

      const referenceUrl = URL.create("https://example.com/reference").unwrap();

      // Create a note card with optional URL
      const noteCard = new CardBuilder()
        .withCuratorId(curatorId.value)
        .withNoteCard("This note references a URL", "Note with URL")
        .withUrl(referenceUrl)
        .buildOrThrow();

      // Add card to curator's library first
      noteCard.addToLibrary(curatorId);

      // 1. Publish the card
      const publishResult = await publisher.publishCardToLibrary(
        noteCard,
        curatorId
      );
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
        const unpublishResult = await publisher.unpublishCardFromLibrary(
          publishedRecordId,
          curatorId
        );
        expect(unpublishResult.isOk()).toBe(true);

        console.log("Successfully unpublished note card with URL");

        // Remove from cleanup list since we've already unpublished it
        publishedCardIds = publishedCardIds.filter(
          (id) => id !== publishedRecordId
        );
      }
    }, 15000);
  });

  describe("Card with Original Published Record ID", () => {
    it("should publish a card that references an original published record", async () => {
      // Skip test if credentials are not available
      if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
        console.warn("Skipping test: BSKY credentials not found in .env.test");
        return;
      }

      const testUrl = URL.create(
        "https://example.com/original-article"
      ).unwrap();

      // Create URL metadata
      const metadata = UrlMetadata.create({
        url: testUrl.value,
        title: "Original Article",
        description: "An original article that will be referenced",
        author: "Original Author",
        siteName: "Example.com",
        type: "article",
        retrievedAt: new Date(),
      }).unwrap();

      // Create a card with an original published record ID (simulating a card that references another published card)
      const originalRecordId = {
        uri: "at://did:plc:example/network.cosmik.card/original123",
        cid: "bafyoriginal123",
      };

      const cardWithOriginal = new CardBuilder()
        .withCuratorId(curatorId.value)
        .withUrlCard(testUrl, metadata)
        .withUrl(testUrl)
        .withOriginalPublishedRecordId(originalRecordId)
        .buildOrThrow();

      // Add card to curator's library first
      cardWithOriginal.addToLibrary(curatorId);

      // 1. Publish the card
      const publishResult = await publisher.publishCardToLibrary(
        cardWithOriginal,
        curatorId
      );
      expect(publishResult.isOk()).toBe(true);

      if (publishResult.isOk()) {
        const publishedRecordId = publishResult.value;
        publishedCardIds.push(publishedRecordId);

        console.log(
          `Published card with original record ID: ${publishedRecordId.getValue().uri}`
        );

        // Verify the card has the original published record ID
        expect(cardWithOriginal.originalPublishedRecordId).toBeDefined();
        expect(cardWithOriginal.originalPublishedRecordId!.getValue().uri).toBe(
          originalRecordId.uri
        );
        expect(cardWithOriginal.originalPublishedRecordId!.getValue().cid).toBe(
          originalRecordId.cid
        );

        // Mark card as published in library
        cardWithOriginal.markCardInLibraryAsPublished(
          curatorId,
          publishedRecordId
        );
        expect(cardWithOriginal.isInLibrary(curatorId)).toBe(true);

        // 2. Unpublish the card
        const unpublishResult = await publisher.unpublishCardFromLibrary(
          publishedRecordId,
          curatorId
        );
        expect(unpublishResult.isOk()).toBe(true);

        console.log("Successfully unpublished card with original record ID");

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

      const invalidCuratorId = CuratorId.create("did:plc:invalid").unwrap();
      const testCard = new CardBuilder()
        .withCuratorId("did:plc:invalid")
        .withNoteCard("Test note")
        .buildOrThrow();

      // Add card to curator's library first
      testCard.addToLibrary(invalidCuratorId);

      const result = await invalidPublisher.publishCardToLibrary(
        testCard,
        invalidCuratorId
      );
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

      const result = await publisher.unpublishCardFromLibrary(
        invalidRecordId,
        curatorId
      );
      expect(result.isErr()).toBe(true);
    }, 10000);
  });
});
