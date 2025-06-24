import { ATProtoCollectionPublisher } from "../ATProtoCollectionPublisher";
import { ATProtoCardPublisher } from "../ATProtoCardPublisher";
import { PublishedRecordId } from "src/modules/cards/domain/value-objects/PublishedRecordId";
import { CollectionBuilder } from "src/modules/cards/tests/utils/builders/CollectionBuilder";
import { CardBuilder } from "src/modules/cards/tests/utils/builders/CardBuilder";
import { Collection } from "src/modules/cards/domain/Collection";
import { Card } from "src/modules/cards/domain/Card";
import { URL } from "src/modules/cards/domain/value-objects/URL";
import { UrlMetadata } from "src/modules/cards/domain/value-objects/UrlMetadata";
import { CollectionAccessType } from "src/modules/cards/domain/value-objects/CollectionAccessType";
import { CuratorId } from "src/modules/annotations/domain/value-objects/CuratorId";
import dotenv from "dotenv";
import { AppPasswordAgentService } from "./AppPasswordAgentService";

// Load environment variables from .env.test
dotenv.config({ path: ".env.test" });

describe.skip("ATProtoCollectionPublisher", () => {
  let collectionPublisher: ATProtoCollectionPublisher;
  let cardPublisher: ATProtoCardPublisher;
  let publishedCollectionIds: PublishedRecordId[] = [];
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

    collectionPublisher = new ATProtoCollectionPublisher(agentService);
    cardPublisher = new ATProtoCardPublisher(agentService);
  });

  afterAll(async () => {
    // Skip cleanup if credentials are not available
    if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
      return;
    }

    // Clean up all published collections
    for (const collectionId of publishedCollectionIds) {
      try {
        await collectionPublisher.unpublish(collectionId);
        console.log(`Cleaned up collection: ${collectionId.getValue().uri}`);
      } catch (error) {
        console.warn(`Failed to clean up collection: ${error}`);
      }
    }

    // Clean up all published cards
    for (const cardId of publishedCardIds) {
      try {
        await cardPublisher.unpublish(cardId);
        console.log(`Cleaned up card: ${cardId.getValue().uri}`);
      } catch (error) {
        console.warn(`Failed to clean up card: ${error}`);
      }
    }
  });

  describe("Collection Publishing", () => {
    it("should publish and unpublish an empty collection", async () => {
      // Skip test if credentials are not available
      if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
        console.warn("Skipping test: BSKY credentials not found in .env.test");
        return;
      }

      const curatorId = process.env.BSKY_DID;

      // Create an empty collection
      const collection = new CollectionBuilder()
        .withAuthorId(curatorId)
        .withName("Test Collection")
        .withDescription("A test collection for publishing")
        .withAccessType(CollectionAccessType.OPEN)
        .buildOrThrow();

      // 1. Publish the collection
      const publishResult = await collectionPublisher.publish(collection);
      expect(publishResult.isOk()).toBe(true);

      if (publishResult.isOk()) {
        const result = publishResult.value;
        expect(result.collectionRecord).toBeDefined();
        expect(result.publishedLinks).toHaveLength(0); // No cards in collection

        const collectionRecordId = result.collectionRecord!;
        publishedCollectionIds.push(collectionRecordId);
        
        console.log(`Published empty collection: ${collectionRecordId.getValue().uri}`);
        
        // Mark collection as published
        collection.markAsPublished(collectionRecordId);
        expect(collection.isPublished()).toBe(true);

        // 2. Test updating the collection
        const updateResult = await collectionPublisher.publish(collection);
        expect(updateResult.isOk()).toBe(true);
        
        if (updateResult.isOk()) {
          expect(updateResult.value.collectionRecord).toBe(collectionRecordId);
          console.log(`Updated collection: ${collectionRecordId.getValue().uri}`);
        }

        // 3. Unpublish the collection
        const unpublishResult = await collectionPublisher.unpublish(collectionRecordId);
        expect(unpublishResult.isOk()).toBe(true);
        
        console.log("Successfully unpublished empty collection");
        
        // Remove from cleanup list since we've already unpublished it
        publishedCollectionIds = publishedCollectionIds.filter(id => id !== collectionRecordId);
      }
    }, 15000);

    it("should publish a collection with cards and collection links", async () => {
      // Skip test if credentials are not available
      if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
        console.warn("Skipping test: BSKY credentials not found in .env.test");
        return;
      }

      const curatorId = process.env.BSKY_DID;
      const curatorIdObj = CuratorId.create(curatorId).unwrap();

      // 1. Create and publish some cards first
      const testUrl1 = URL.create("https://example.com/article1").unwrap();
      const metadata1 = UrlMetadata.create({
        url: testUrl1.value,
        title: "Test Article 1",
        description: "First test article",
        retrievedAt: new Date(),
      }).unwrap();

      const card1 = new CardBuilder()
        .withCuratorId(curatorId)
        .withUrlCard(testUrl1, metadata1)
        .withUrl(testUrl1)
        .buildOrThrow();

      const testUrl2 = URL.create("https://example.com/article2").unwrap();
      const metadata2 = UrlMetadata.create({
        url: testUrl2.value,
        title: "Test Article 2",
        description: "Second test article",
        retrievedAt: new Date(),
      }).unwrap();

      const card2 = new CardBuilder()
        .withCuratorId(curatorId)
        .withUrlCard(testUrl2, metadata2)
        .withUrl(testUrl2)
        .buildOrThrow();

      // Publish the cards
      const card1PublishResult = await cardPublisher.publish(card1);
      expect(card1PublishResult.isOk()).toBe(true);
      const card1RecordId = card1PublishResult.unwrap();
      publishedCardIds.push(card1RecordId);
      card1.markAsPublished(card1RecordId);

      const card2PublishResult = await cardPublisher.publish(card2);
      expect(card2PublishResult.isOk()).toBe(true);
      const card2RecordId = card2PublishResult.unwrap();
      publishedCardIds.push(card2RecordId);
      card2.markAsPublished(card2RecordId);

      console.log(`Published cards: ${card1RecordId.getValue().uri}, ${card2RecordId.getValue().uri}`);

      // 2. Create a collection and add the cards
      const collection = new CollectionBuilder()
        .withAuthorId(curatorId)
        .withName("Test Collection with Cards")
        .withDescription("A collection containing test cards")
        .withAccessType(CollectionAccessType.OPEN)
        .buildOrThrow();

      // Add cards to collection
      const addCard1Result = collection.addCard(card1.cardId, curatorIdObj);
      expect(addCard1Result.isOk()).toBe(true);

      const addCard2Result = collection.addCard(card2.cardId, curatorIdObj);
      expect(addCard2Result.isOk()).toBe(true);

      // Verify collection has unpublished links
      const unpublishedLinks = collection.getUnpublishedCardLinks();
      expect(unpublishedLinks).toHaveLength(2);

      // 3. Publish the collection (should publish collection record and card links)
      const publishResult = await collectionPublisher.publish(collection);
      expect(publishResult.isOk()).toBe(true);

      if (publishResult.isOk()) {
        const result = publishResult.value;
        expect(result.collectionRecord).toBeDefined();
        expect(result.publishedLinks).toHaveLength(2); // Two card links published

        const collectionRecordId = result.collectionRecord!;
        publishedCollectionIds.push(collectionRecordId);
        
        console.log(`Published collection with cards: ${collectionRecordId.getValue().uri}`);
        console.log(`Published ${result.publishedLinks.length} card links`);

        // Mark collection and links as published
        collection.markAsPublished(collectionRecordId);
        for (const publishedLink of result.publishedLinks) {
          // Note: In a real implementation, you'd need to match the card ID to the link
          // For now, we'll just verify the structure
          expect(publishedLink.cardId).toBeDefined();
          expect(publishedLink.linkRecord).toBeDefined();
        }

        // 4. Verify no more unpublished links
        const remainingUnpublishedLinks = collection.getUnpublishedCardLinks();
        expect(remainingUnpublishedLinks).toHaveLength(0);

        // 5. Test adding another card to the existing collection
        const testUrl3 = URL.create("https://example.com/article3").unwrap();
        const metadata3 = UrlMetadata.create({
          url: testUrl3.value,
          title: "Test Article 3",
          description: "Third test article",
          retrievedAt: new Date(),
        }).unwrap();

        const card3 = new CardBuilder()
          .withCuratorId(curatorId)
          .withUrlCard(testUrl3, metadata3)
          .withUrl(testUrl3)
          .buildOrThrow();

        const card3PublishResult = await cardPublisher.publish(card3);
        expect(card3PublishResult.isOk()).toBe(true);
        const card3RecordId = card3PublishResult.unwrap();
        publishedCardIds.push(card3RecordId);
        card3.markAsPublished(card3RecordId);

        // Add the new card to the collection
        const addCard3Result = collection.addCard(card3.cardId, curatorIdObj);
        expect(addCard3Result.isOk()).toBe(true);

        // Publish the collection again (should only publish the new link)
        const updatePublishResult = await collectionPublisher.publish(collection);
        expect(updatePublishResult.isOk()).toBe(true);

        if (updatePublishResult.isOk()) {
          const updateResult = updatePublishResult.value;
          expect(updateResult.collectionRecord).toBe(collectionRecordId); // Same collection record
          expect(updateResult.publishedLinks).toHaveLength(1); // Only one new link

          console.log(`Published additional card link for card 3`);
        }

        // 6. Unpublish the collection
        const unpublishResult = await collectionPublisher.unpublish(collectionRecordId);
        expect(unpublishResult.isOk()).toBe(true);
        
        console.log("Successfully unpublished collection with cards");
        
        // Remove from cleanup list since we've already unpublished it
        publishedCollectionIds = publishedCollectionIds.filter(id => id !== collectionRecordId);
      }
    }, 30000);
  });

  describe("Closed Collection Publishing", () => {
    it("should publish a closed collection with collaborators", async () => {
      // Skip test if credentials are not available
      if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
        console.warn("Skipping test: BSKY credentials not found in .env.test");
        return;
      }

      const curatorId = process.env.BSKY_DID;
      const collaboratorDid = "did:plc:collaborator123"; // Mock collaborator

      // Create a closed collection with collaborators
      const collection = new CollectionBuilder()
        .withAuthorId(curatorId)
        .withName("Closed Test Collection")
        .withDescription("A closed collection for testing")
        .withAccessType(CollectionAccessType.CLOSED)
        .withCollaborators([collaboratorDid])
        .buildOrThrow();

      // 1. Publish the collection
      const publishResult = await collectionPublisher.publish(collection);
      expect(publishResult.isOk()).toBe(true);

      if (publishResult.isOk()) {
        const result = publishResult.value;
        expect(result.collectionRecord).toBeDefined();

        const collectionRecordId = result.collectionRecord!;
        publishedCollectionIds.push(collectionRecordId);
        
        console.log(`Published closed collection: ${collectionRecordId.getValue().uri}`);
        
        // Mark collection as published
        collection.markAsPublished(collectionRecordId);

        // Verify collection properties
        expect(collection.accessType.value).toBe(CollectionAccessType.CLOSED.value);
        expect(collection.collaborators).toHaveLength(1);
        expect(collection.collaborators[0].value).toBe(collaboratorDid);

        // 2. Unpublish the collection
        const unpublishResult = await collectionPublisher.unpublish(collectionRecordId);
        expect(unpublishResult.isOk()).toBe(true);
        
        console.log("Successfully unpublished closed collection");
        
        // Remove from cleanup list since we've already unpublished it
        publishedCollectionIds = publishedCollectionIds.filter(id => id !== collectionRecordId);
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

      const invalidPublisher = new ATProtoCollectionPublisher(invalidAgentService);

      const testCollection = new CollectionBuilder()
        .withAuthorId("did:plc:invalid")
        .withName("Test Collection")
        .withAccessType(CollectionAccessType.OPEN)
        .buildOrThrow();

      const result = await invalidPublisher.publish(testCollection);
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
        uri: "at://did:plc:invalid/app.cards.collection/invalid",
        cid: "bafyinvalid",
      });

      const result = await collectionPublisher.unpublish(invalidRecordId);
      expect(result.isErr()).toBe(true);

      if (result.isErr()) {
        expect(result.error.message).toMatch(/error|failed/i);
      }
    }, 10000);

    it("should handle collections with unpublished cards gracefully", async () => {
      // Skip test if credentials are not available
      if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
        console.warn("Skipping test: BSKY credentials not found in .env.test");
        return;
      }

      const curatorId = process.env.BSKY_DID;
      const curatorIdObj = CuratorId.create(curatorId).unwrap();

      // Create a collection
      const collection = new CollectionBuilder()
        .withAuthorId(curatorId)
        .withName("Collection with Unpublished Card")
        .withAccessType(CollectionAccessType.OPEN)
        .buildOrThrow();

      // Create an unpublished card
      const unpublishedCard = new CardBuilder()
        .withCuratorId(curatorId)
        .withNoteCard("Unpublished note")
        .buildOrThrow();

      // Add unpublished card to collection
      const addCardResult = collection.addCard(unpublishedCard.cardId, curatorIdObj);
      expect(addCardResult.isOk()).toBe(true);

      // Try to publish the collection
      const publishResult = await collectionPublisher.publish(collection);
      
      // Should succeed for the collection but fail for the card link
      expect(publishResult.isOk()).toBe(true);

      if (publishResult.isOk()) {
        const result = publishResult.value;
        expect(result.collectionRecord).toBeDefined();
        // The card link should fail to publish, so publishedLinks might be empty
        // or the implementation might handle this gracefully

        const collectionRecordId = result.collectionRecord!;
        publishedCollectionIds.push(collectionRecordId);
        
        console.log(`Published collection despite unpublished card: ${collectionRecordId.getValue().uri}`);
        
        // Clean up
        const unpublishResult = await collectionPublisher.unpublish(collectionRecordId);
        expect(unpublishResult.isOk()).toBe(true);
        publishedCollectionIds = publishedCollectionIds.filter(id => id !== collectionRecordId);
      }
    }, 15000);
  });
});
