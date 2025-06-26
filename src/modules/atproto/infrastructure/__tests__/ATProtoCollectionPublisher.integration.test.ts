import { ATProtoCollectionPublisher } from "../publishers/ATProtoCollectionPublisher";
import { ATProtoCardPublisher } from "../publishers/ATProtoCardPublisher";
import { PublishedRecordId } from "src/modules/cards/domain/value-objects/PublishedRecordId";
import { CollectionBuilder } from "src/modules/cards/tests/utils/builders/CollectionBuilder";
import { CardBuilder } from "src/modules/cards/tests/utils/builders/CardBuilder";
import {
  Collection,
  CollectionAccessType,
} from "src/modules/cards/domain/Collection";
import { Card } from "src/modules/cards/domain/Card";
import { URL } from "src/modules/cards/domain/value-objects/URL";
import { UrlMetadata } from "src/modules/cards/domain/value-objects/UrlMetadata";
import { CuratorId } from "src/modules/annotations/domain/value-objects/CuratorId";
import dotenv from "dotenv";
import { AppPasswordAgentService } from "./AppPasswordAgentService";

// Load environment variables from .env.test
dotenv.config({ path: ".env.test" });

describe("ATProtoCollectionPublisher", () => {
  let collectionPublisher: ATProtoCollectionPublisher;
  let cardPublisher: ATProtoCardPublisher;
  let curatorId: CuratorId;
  let publishedCollectionIds: PublishedRecordId[] = [];
  let publishedCardIds: PublishedRecordId[] = [];
  let publishedLinkIds: PublishedRecordId[] = [];

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
    curatorId = CuratorId.create(process.env.BSKY_DID).unwrap();
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

    // Clean up all published collection links
    for (const linkId of publishedLinkIds) {
      try {
        await collectionPublisher.unpublishCardAddedToCollection(linkId);
        console.log(`Cleaned up collection link: ${linkId.getValue().uri}`);
      } catch (error) {
        console.warn(`Failed to clean up collection link: ${error}`);
      }
    }

    // Clean up all published cards
    for (const cardId of publishedCardIds) {
      try {
        await cardPublisher.unpublishCardFromLibrary(cardId, curatorId);
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

      // Create an empty collection
      const collection = new CollectionBuilder()
        .withAuthorId(curatorId.value)
        .withName("Test Collection")
        .withDescription("A test collection for publishing")
        .withAccessType(CollectionAccessType.OPEN)
        .buildOrThrow();

      // 1. Publish the collection
      const publishResult = await collectionPublisher.publish(collection);
      expect(publishResult.isOk()).toBe(true);

      if (publishResult.isOk()) {
        const collectionRecordId = publishResult.value;
        publishedCollectionIds.push(collectionRecordId);

        console.log(
          `Published empty collection: ${collectionRecordId.getValue().uri}`
        );

        // Mark collection as published
        collection.markAsPublished(collectionRecordId);
        expect(collection.isPublished).toBe(true);

        // 2. Test updating the collection
        const updateResult = await collectionPublisher.publish(collection);
        expect(updateResult.isOk()).toBe(true);

        if (updateResult.isOk()) {
          expect(updateResult.value).toBe(collectionRecordId);
          console.log(
            `Updated collection: ${collectionRecordId.getValue().uri}`
          );
        }

        // 3. Unpublish the collection
        const unpublishResult =
          await collectionPublisher.unpublish(collectionRecordId);
        expect(unpublishResult.isOk()).toBe(true);

        console.log("Successfully unpublished empty collection");

        // Remove from cleanup list since we've already unpublished it
        publishedCollectionIds = publishedCollectionIds.filter(
          (id) => id !== collectionRecordId
        );
      }
    }, 15000);

    it("should publish a collection with cards and collection links", async () => {
      // Skip test if credentials are not available
      if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
        console.warn("Skipping test: BSKY credentials not found in .env.test");
        return;
      }

      // 1. Create and publish some cards first
      const testUrl1 = URL.create("https://example.com/article1").unwrap();
      const metadata1 = UrlMetadata.create({
        url: testUrl1.value,
        title: "Test Article 1",
        description: "First test article",
        retrievedAt: new Date(),
      }).unwrap();

      const card1 = new CardBuilder()
        .withCuratorId(curatorId.value)
        .withUrlCard(testUrl1, metadata1)
        .withUrl(testUrl1)
        .withOriginalPublishedRecordId({
          uri: "at://did:plc:original/network.cosmik.card/original1",
          cid: "bafyoriginal1",
        })
        .buildOrThrow();

      const testUrl2 = URL.create("https://example.com/article2").unwrap();
      const metadata2 = UrlMetadata.create({
        url: testUrl2.value,
        title: "Test Article 2",
        description: "Second test article",
        retrievedAt: new Date(),
      }).unwrap();

      const card2 = new CardBuilder()
        .withCuratorId(curatorId.value)
        .withUrlCard(testUrl2, metadata2)
        .withUrl(testUrl2)
        .withOriginalPublishedRecordId({
          uri: "at://did:plc:original/network.cosmik.card/original2",
          cid: "bafyoriginal2",
        })
        .buildOrThrow();

      // Add cards to curator's library and publish them
      card1.addToLibrary(curatorId);
      card2.addToLibrary(curatorId);

      const card1PublishResult = await cardPublisher.publishCardToLibrary(
        card1,
        curatorId
      );
      expect(card1PublishResult.isOk()).toBe(true);
      const card1RecordId = card1PublishResult.unwrap();
      publishedCardIds.push(card1RecordId);
      card1.markCardInLibraryAsPublished(curatorId, card1RecordId);

      const card2PublishResult = await cardPublisher.publishCardToLibrary(
        card2,
        curatorId
      );
      expect(card2PublishResult.isOk()).toBe(true);
      const card2RecordId = card2PublishResult.unwrap();
      publishedCardIds.push(card2RecordId);
      card2.markCardInLibraryAsPublished(curatorId, card2RecordId);

      console.log(
        `Published cards: ${card1RecordId.getValue().uri}, ${card2RecordId.getValue().uri}`
      );

      // 2. Create a collection and add the cards
      const collection = new CollectionBuilder()
        .withAuthorId(curatorId.value)
        .withName("Test Collection with Cards")
        .withDescription("A collection containing test cards")
        .withAccessType(CollectionAccessType.OPEN)
        .buildOrThrow();

      // Add cards to collection
      const addCard1Result = collection.addCard(card1.cardId, curatorId);
      expect(addCard1Result.isOk()).toBe(true);

      const addCard2Result = collection.addCard(card2.cardId, curatorId);
      expect(addCard2Result.isOk()).toBe(true);

      // 3. Publish the collection (collection record only)
      const publishResult = await collectionPublisher.publish(collection);
      expect(publishResult.isOk()).toBe(true);

      if (publishResult.isOk()) {
        const collectionRecordId = publishResult.value;
        publishedCollectionIds.push(collectionRecordId);

        console.log(
          `Published collection: ${collectionRecordId.getValue().uri}`
        );

        // Mark collection as published
        collection.markAsPublished(collectionRecordId);

        // 4. Publish the card links separately
        const link1PublishResult =
          await collectionPublisher.publishCardAddedToCollection(
            card1,
            collection,
            curatorId
          );
        expect(link1PublishResult.isOk()).toBe(true);
        const link1RecordId = link1PublishResult.unwrap();
        publishedLinkIds.push(link1RecordId);
        collection.markCardLinkAsPublished(card1.cardId, link1RecordId);

        const link2PublishResult =
          await collectionPublisher.publishCardAddedToCollection(
            card2,
            collection,
            curatorId
          );
        expect(link2PublishResult.isOk()).toBe(true);
        const link2RecordId = link2PublishResult.unwrap();
        publishedLinkIds.push(link2RecordId);
        collection.markCardLinkAsPublished(card2.cardId, link2RecordId);

        console.log(
          `Published card links: ${link1RecordId.getValue().uri}, ${link2RecordId.getValue().uri}`
        );

        // 5. Test adding another card to the existing collection
        const testUrl3 = URL.create("https://example.com/article3").unwrap();
        const metadata3 = UrlMetadata.create({
          url: testUrl3.value,
          title: "Test Article 3",
          description: "Third test article",
          retrievedAt: new Date(),
        }).unwrap();

        const card3 = new CardBuilder()
          .withCuratorId(curatorId.value)
          .withUrlCard(testUrl3, metadata3)
          .withUrl(testUrl3)
          .withOriginalPublishedRecordId({
            uri: "at://did:plc:original/network.cosmik.card/original3",
            cid: "bafyoriginal3",
          })
          .buildOrThrow();

        card3.addToLibrary(curatorId);
        const card3PublishResult = await cardPublisher.publishCardToLibrary(
          card3,
          curatorId
        );
        expect(card3PublishResult.isOk()).toBe(true);
        const card3RecordId = card3PublishResult.unwrap();
        publishedCardIds.push(card3RecordId);
        card3.markCardInLibraryAsPublished(curatorId, card3RecordId);

        // Add the new card to the collection
        const addCard3Result = collection.addCard(card3.cardId, curatorId);
        expect(addCard3Result.isOk()).toBe(true);

        // Publish the new card link
        const link3PublishResult =
          await collectionPublisher.publishCardAddedToCollection(
            card3,
            collection,
            curatorId
          );
        expect(link3PublishResult.isOk()).toBe(true);
        const link3RecordId = link3PublishResult.unwrap();
        publishedLinkIds.push(link3RecordId);

        console.log(
          `Published additional card link for card 3: ${link3RecordId.getValue().uri}`
        );

        // 6. Unpublish the collection
        const unpublishResult =
          await collectionPublisher.unpublish(collectionRecordId);
        expect(unpublishResult.isOk()).toBe(true);

        console.log("Successfully unpublished collection with cards");

        // Remove from cleanup list since we've already unpublished it
        publishedCollectionIds = publishedCollectionIds.filter(
          (id) => id !== collectionRecordId
        );
      }
    }, 30000);
  });

  describe.skip("Closed Collection Publishing", () => {
    it("should publish a closed collection with collaborators", async () => {
      // Skip test if credentials are not available
      if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
        console.warn("Skipping test: BSKY credentials not found in .env.test");
        return;
      }

      const collaboratorDid = "did:plc:collaborator123"; // Mock collaborator

      // Create a closed collection with collaborators
      const collection = new CollectionBuilder()
        .withAuthorId(curatorId.value)
        .withName("Closed Test Collection")
        .withDescription("A closed collection for testing")
        .withAccessType(CollectionAccessType.CLOSED)
        .withCollaborators([collaboratorDid])
        .buildOrThrow();

      // 1. Publish the collection
      const publishResult = await collectionPublisher.publish(collection);
      expect(publishResult.isOk()).toBe(true);

      if (publishResult.isOk()) {
        const collectionRecordId = publishResult.value;
        publishedCollectionIds.push(collectionRecordId);

        console.log(
          `Published closed collection: ${collectionRecordId.getValue().uri}`
        );

        // Mark collection as published
        collection.markAsPublished(collectionRecordId);

        // Verify collection properties
        expect(collection.accessType).toBe(CollectionAccessType.CLOSED);
        expect(collection.collaboratorIds).toHaveLength(1);
        expect(collection.collaboratorIds[0]?.value).toBe(collaboratorDid);

        // 2. Unpublish the collection
        const unpublishResult =
          await collectionPublisher.unpublish(collectionRecordId);
        expect(unpublishResult.isOk()).toBe(true);

        console.log("Successfully unpublished closed collection");

        // Remove from cleanup list since we've already unpublished it
        publishedCollectionIds = publishedCollectionIds.filter(
          (id) => id !== collectionRecordId
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

      const invalidPublisher = new ATProtoCollectionPublisher(
        invalidAgentService
      );

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
        uri: "at://did:plc:invalid/network.cosmik.collection/invalid",
        cid: "bafyinvalid",
      });

      const result = await collectionPublisher.unpublish(invalidRecordId);
      expect(result.isErr()).toBe(true);
    }, 10000);

    it("should handle collections with unpublished cards gracefully", async () => {
      // Skip test if credentials are not available
      if (!process.env.BSKY_DID || !process.env.BSKY_APP_PASSWORD) {
        console.warn("Skipping test: BSKY credentials not found in .env.test");
        return;
      }

      // Create a collection
      const collection = new CollectionBuilder()
        .withAuthorId(curatorId.value)
        .withName("Collection with Unpublished Card")
        .withAccessType(CollectionAccessType.OPEN)
        .buildOrThrow();

      // Create an unpublished card
      const unpublishedCard = new CardBuilder()
        .withCuratorId(curatorId.value)
        .withNoteCard("Unpublished note")
        .buildOrThrow();

      // Add unpublished card to collection
      const addCardResult = collection.addCard(
        unpublishedCard.cardId,
        curatorId
      );
      expect(addCardResult.isOk()).toBe(true);

      // Try to publish the collection (should succeed)
      const publishResult = await collectionPublisher.publish(collection);
      expect(publishResult.isOk()).toBe(true);

      if (publishResult.isOk()) {
        const collectionRecordId = publishResult.value;
        publishedCollectionIds.push(collectionRecordId);

        console.log(
          `Published collection: ${collectionRecordId.getValue().uri}`
        );

        collection.markAsPublished(collectionRecordId);

        // Try to publish the card link (should fail because card is not published)
        const linkPublishResult =
          await collectionPublisher.publishCardAddedToCollection(
            unpublishedCard,
            collection,
            curatorId
          );
        expect(linkPublishResult.isErr()).toBe(true);

        if (linkPublishResult.isErr()) {
          expect(linkPublishResult.error.message).toMatch(
            /published in curator's library/i
          );
        }

        // Clean up
        const unpublishResult =
          await collectionPublisher.unpublish(collectionRecordId);
        expect(unpublishResult.isOk()).toBe(true);
        publishedCollectionIds = publishedCollectionIds.filter(
          (id) => id !== collectionRecordId
        );
      }
    }, 15000);
  });
});
