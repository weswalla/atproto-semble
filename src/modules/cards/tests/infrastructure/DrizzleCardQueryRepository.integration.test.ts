import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import postgres from "postgres";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DrizzleCardQueryRepository } from "../../infrastructure/repositories/DrizzleCardQueryRepository";
import { DrizzleCardRepository } from "../../infrastructure/repositories/DrizzleCardRepository";
import { DrizzleCollectionRepository } from "../../infrastructure/repositories/DrizzleCollectionRepository";
import { CuratorId } from "../../../annotations/domain/value-objects/CuratorId";
import { UniqueEntityID } from "../../../../shared/domain/UniqueEntityID";
import { cards } from "../../infrastructure/repositories/schema/card.sql";
import {
  collections,
  collectionCards,
} from "../../infrastructure/repositories/schema/collection.sql";
import { libraryMemberships } from "../../infrastructure/repositories/schema/libraryMembership.sql";
import { publishedRecords } from "../../../annotations/infrastructure/repositories/schema/publishedRecord.sql";
import { Collection, CollectionAccessType } from "../../domain/Collection";
import { CardBuilder } from "../utils/builders/CardBuilder";
import { URL } from "../../domain/value-objects/URL";
import { UrlMetadata } from "../../domain/value-objects/UrlMetadata";
import { CardSortField, SortOrder } from "../../domain/ICardQueryRepository";
import { createTestSchema } from "../test-utils/createTestSchema";

describe("DrizzleCardQueryRepository", () => {
  let container: StartedPostgreSqlContainer;
  let db: PostgresJsDatabase;
  let queryRepository: DrizzleCardQueryRepository;
  let cardRepository: DrizzleCardRepository;
  let collectionRepository: DrizzleCollectionRepository;

  // Test data
  let curatorId: CuratorId;
  let otherCuratorId: CuratorId;
  let thirdCuratorId: CuratorId;

  // Setup before all tests
  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer().start();

    // Create database connection
    const connectionString = container.getConnectionUri();
    process.env.DATABASE_URL = connectionString;
    const client = postgres(connectionString);
    db = drizzle(client);

    // Create repositories
    queryRepository = new DrizzleCardQueryRepository(db);
    cardRepository = new DrizzleCardRepository(db);
    collectionRepository = new DrizzleCollectionRepository(db);

    // Create schema using helper function
    await createTestSchema(db);

    // Create test data
    curatorId = CuratorId.create("did:plc:testcurator").unwrap();
    otherCuratorId = CuratorId.create("did:plc:othercurator").unwrap();
    thirdCuratorId = CuratorId.create("did:plc:thirdcurator").unwrap();
  }, 60000); // Increase timeout for container startup

  // Cleanup after all tests
  afterAll(async () => {
    // Stop container
    await container.stop();
  });

  // Clear data between tests
  beforeEach(async () => {
    await db.delete(collectionCards);
    await db.delete(collections);
    await db.delete(libraryMemberships);
    await db.delete(cards);
    await db.delete(publishedRecords);
  });

  describe("getUrlCardsOfUser", () => {
    it("should return empty result when user has no URL cards", async () => {
      const result = await queryRepository.getUrlCardsOfUser(curatorId.value, {
        page: 1,
        limit: 10,
        sortBy: CardSortField.UPDATED_AT,
        sortOrder: SortOrder.DESC,
      });

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it("should return URL cards for a user", async () => {
      // Create URL cards
      const url1 = URL.create("https://example.com/article1").unwrap();
      const urlMetadata1 = UrlMetadata.create({
        url: url1.value,
        title: "Example Article 1",
        description: "A great article about testing",
        author: "John Doe",
        imageUrl: "https://example.com/image1.jpg",
      }).unwrap();

      const urlCard1 = new CardBuilder()
        .withCuratorId(curatorId.value)
        .withUrlCard(url1, urlMetadata1)
        .withCreatedAt(new Date("2023-01-01"))
        .withUpdatedAt(new Date("2023-01-01"))
        .buildOrThrow();

      const url2 = URL.create("https://example.com/article2").unwrap();
      const urlCard2 = new CardBuilder()
        .withCuratorId(curatorId.value)
        .withUrlCard(url2)
        .withCreatedAt(new Date("2023-01-02"))
        .withUpdatedAt(new Date("2023-01-02"))
        .buildOrThrow();

      // Save cards
      await cardRepository.save(urlCard1);
      await cardRepository.save(urlCard2);

      // Add cards to user's library using domain logic
      urlCard1.addToLibrary(curatorId);
      urlCard2.addToLibrary(curatorId);

      // Save the updated cards
      await cardRepository.save(urlCard1);
      await cardRepository.save(urlCard2);

      // Query URL cards
      const result = await queryRepository.getUrlCardsOfUser(curatorId.value, {
        page: 1,
        limit: 10,
        sortBy: CardSortField.UPDATED_AT,
        sortOrder: SortOrder.DESC,
      });

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.hasMore).toBe(false);

      // Check URL card data
      const card1Result = result.items.find((item) => item.url === url1.value);
      const card2Result = result.items.find((item) => item.url === url2.value);

      expect(card1Result).toBeDefined();
      expect(card1Result?.urlMeta.title).toBe("Example Article 1");
      expect(card1Result?.urlMeta.description).toBe(
        "A great article about testing"
      );
      expect(card1Result?.urlMeta.author).toBe("John Doe");
      expect(card1Result?.urlMeta.thumbnailUrl).toBe(
        "https://example.com/image1.jpg"
      );

      expect(card2Result).toBeDefined();
      expect(card2Result?.urlMeta.title).toBeUndefined(); // No metadata provided
    });

    it("should include connected note cards", async () => {
      // Create URL card
      const url = URL.create("https://example.com/article").unwrap();
      const urlCard = new CardBuilder()
        .withCuratorId(curatorId.value)
        .withUrlCard(url)
        .buildOrThrow();

      await cardRepository.save(urlCard);

      // Create note card connected to URL card
      const noteCard = new CardBuilder()
        .withCuratorId(curatorId.value)
        .withNoteCard("This is my note about the article", "My Thoughts")
        .withParentCard(urlCard.cardId)
        .buildOrThrow();

      await cardRepository.save(noteCard);

      // Add both cards to user's library using domain logic
      urlCard.addToLibrary(curatorId);
      noteCard.addToLibrary(curatorId);

      // Save the updated cards
      await cardRepository.save(urlCard);
      await cardRepository.save(noteCard);

      // Query URL cards
      const result = await queryRepository.getUrlCardsOfUser(curatorId.value, {
        page: 1,
        limit: 10,
        sortBy: CardSortField.UPDATED_AT,
        sortOrder: SortOrder.DESC,
      });

      expect(result.items).toHaveLength(1);
      const urlCardResult = result.items[0];

      expect(urlCardResult?.note).toBeDefined();
      expect(urlCardResult?.note?.id).toBe(noteCard.cardId.getStringValue());
      expect(urlCardResult?.note?.text).toBe(
        "This is my note about the article"
      );
    });

    it("should include collections that contain the URL cards", async () => {
      // Create URL card
      const url = URL.create("https://example.com/article").unwrap();
      const urlCard = new CardBuilder()
        .withCuratorId(curatorId.value)
        .withUrlCard(url)
        .buildOrThrow();

      await cardRepository.save(urlCard);

      // Create collections
      const collection1 = Collection.create(
        {
          authorId: curatorId,
          name: "Reading List",
          description: "Articles to read",
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        new UniqueEntityID()
      ).unwrap();

      const collection2 = Collection.create(
        {
          authorId: curatorId,
          name: "Favorites",
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        new UniqueEntityID()
      ).unwrap();

      // Add card to collections
      collection1.addCard(urlCard.cardId, curatorId);
      collection2.addCard(urlCard.cardId, curatorId);

      await collectionRepository.save(collection1);
      await collectionRepository.save(collection2);

      // Add card to user's library using domain logic
      urlCard.addToLibrary(curatorId);

      // Save the updated card
      await cardRepository.save(urlCard);

      // Query URL cards
      const result = await queryRepository.getUrlCardsOfUser(curatorId.value, {
        page: 1,
        limit: 10,
        sortBy: CardSortField.UPDATED_AT,
        sortOrder: SortOrder.DESC,
      });

      expect(result.items).toHaveLength(1);
      const urlCardResult = result.items[0];

      expect(urlCardResult?.collections).toHaveLength(2);

      const collectionNames = urlCardResult?.collections
        .map((c) => c.name)
        .sort();
      expect(collectionNames).toEqual(["Favorites", "Reading List"]);

      // Check collection details
      const readingListCollection = urlCardResult?.collections.find(
        (c) => c.name === "Reading List"
      );
      expect(readingListCollection?.authorId).toBe(curatorId.value);
      expect(readingListCollection?.id).toBe(
        collection1.collectionId.getStringValue()
      );
    });

    it("should handle multiple users with library memberships", async () => {
      // Create URL card
      const url = URL.create("https://example.com/shared-article").unwrap();
      const urlCard = new CardBuilder()
        .withCuratorId(curatorId.value)
        .withUrlCard(url)
        .buildOrThrow();

      await cardRepository.save(urlCard);

      // Add card to first user's library
      urlCard.addToLibrary(curatorId);
      await cardRepository.save(urlCard);

      // Add card to second user's library
      urlCard.addToLibrary(otherCuratorId);
      await cardRepository.save(urlCard);

      // Add card to third user's library
      urlCard.addToLibrary(thirdCuratorId);
      await cardRepository.save(urlCard);

      // Query URL cards for first user
      const result1 = await queryRepository.getUrlCardsOfUser(curatorId.value, {
        page: 1,
        limit: 10,
        sortBy: CardSortField.UPDATED_AT,
        sortOrder: SortOrder.DESC,
      });

      // Query URL cards for second user
      const result2 = await queryRepository.getUrlCardsOfUser(
        otherCuratorId.value,
        {
          page: 1,
          limit: 10,
          sortBy: CardSortField.UPDATED_AT,
          sortOrder: SortOrder.DESC,
        }
      );

      // Query URL cards for third user
      const result3 = await queryRepository.getUrlCardsOfUser(
        thirdCuratorId.value,
        {
          page: 1,
          limit: 10,
          sortBy: CardSortField.UPDATED_AT,
          sortOrder: SortOrder.DESC,
        }
      );

      // All users should see the card
      expect(result1.items).toHaveLength(1);
      expect(result2.items).toHaveLength(1);
      expect(result3.items).toHaveLength(1);

      // Library count should be 3 for all users
      expect(result1.items[0]?.libraryCount).toBe(3);
      expect(result2.items[0]?.libraryCount).toBe(3);
      expect(result3.items[0]?.libraryCount).toBe(3);
    });

    it("should not return URL cards from other users' libraries", async () => {
      // Create URL card for other user
      const url = URL.create("https://example.com/private-article").unwrap();
      const urlCard = new CardBuilder()
        .withCuratorId(otherCuratorId.value)
        .withUrlCard(url)
        .buildOrThrow();

      await cardRepository.save(urlCard);

      // Add card only to other user's library using domain logic
      urlCard.addToLibrary(otherCuratorId);

      // Save the updated card
      await cardRepository.save(urlCard);

      // Query URL cards for our user
      const result = await queryRepository.getUrlCardsOfUser(curatorId.value, {
        page: 1,
        limit: 10,
        sortBy: CardSortField.UPDATED_AT,
        sortOrder: SortOrder.DESC,
      });

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it("should not return note cards that are not connected to URL cards", async () => {
      // Create standalone note card
      const noteCard = new CardBuilder()
        .withCuratorId(curatorId.value)
        .withNoteCard("Standalone note")
        .buildOrThrow();

      await cardRepository.save(noteCard);

      // Add note card to user's library using domain logic
      noteCard.addToLibrary(curatorId);

      // Save the updated card
      await cardRepository.save(noteCard);

      // Query URL cards
      const result = await queryRepository.getUrlCardsOfUser(curatorId.value, {
        page: 1,
        limit: 10,
        sortBy: CardSortField.UPDATED_AT,
        sortOrder: SortOrder.DESC,
      });

      // Should not return the note card since it's not a URL card
      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it("should handle complex scenario with URL card, note, and multiple collections", async () => {
      // Create URL card with metadata
      const url = URL.create("https://example.com/complex-article").unwrap();
      const urlMetadata = UrlMetadata.create({
        url: url.value,
        title: "Complex Article",
        description: "An article with notes and collections",
        author: "Jane Smith",
        imageUrl: "https://example.com/complex.jpg",
        siteName: "Example Site",
      }).unwrap();

      const urlCard = new CardBuilder()
        .withCuratorId(curatorId.value)
        .withUrlCard(url, urlMetadata)
        .buildOrThrow();

      await cardRepository.save(urlCard);

      // Create connected note
      const noteCard = new CardBuilder()
        .withCuratorId(curatorId.value)
        .withNoteCard("Detailed analysis of the complex article", "Analysis")
        .withParentCard(urlCard.cardId)
        .buildOrThrow();

      await cardRepository.save(noteCard);

      // Create multiple collections
      const workCollection = Collection.create(
        {
          authorId: curatorId,
          name: "Work Research",
          description: "Articles for work projects",
          accessType: CollectionAccessType.CLOSED,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        new UniqueEntityID()
      ).unwrap();

      const personalCollection = Collection.create(
        {
          authorId: curatorId,
          name: "Personal Reading",
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        new UniqueEntityID()
      ).unwrap();

      // Add URL card to collections
      workCollection.addCard(urlCard.cardId, curatorId);
      personalCollection.addCard(urlCard.cardId, curatorId);

      await collectionRepository.save(workCollection);
      await collectionRepository.save(personalCollection);

      // Add both cards to user's library with multiple memberships using domain logic
      urlCard.addToLibrary(curatorId);
      await cardRepository.save(urlCard);

      noteCard.addToLibrary(curatorId);
      await cardRepository.save(noteCard);

      urlCard.addToLibrary(otherCuratorId);
      await cardRepository.save(urlCard);

      urlCard.addToLibrary(thirdCuratorId);
      await cardRepository.save(urlCard);

      // Query URL cards
      const result = await queryRepository.getUrlCardsOfUser(curatorId.value, {
        page: 1,
        limit: 10,
        sortBy: CardSortField.UPDATED_AT,
        sortOrder: SortOrder.DESC,
      });

      expect(result.items).toHaveLength(1);
      const urlCardResult = result.items[0];

      // Check URL metadata
      expect(urlCardResult?.url).toBe(url.value);
      expect(urlCardResult?.urlMeta.title).toBe("Complex Article");
      expect(urlCardResult?.urlMeta.description).toBe(
        "An article with notes and collections"
      );
      expect(urlCardResult?.urlMeta.author).toBe("Jane Smith");
      expect(urlCardResult?.urlMeta.thumbnailUrl).toBe(
        "https://example.com/complex.jpg"
      );

      // Check library count
      expect(urlCardResult?.libraryCount).toBe(3);

      // Check connected note
      expect(urlCardResult?.note).toBeDefined();
      expect(urlCardResult?.note?.id).toBe(noteCard.cardId.getStringValue());
      expect(urlCardResult?.note?.text).toBe(
        "Detailed analysis of the complex article"
      );

      // Check collections
      expect(urlCardResult?.collections).toHaveLength(2);
      const collectionNames = urlCardResult?.collections
        .map((c) => c.name)
        .sort();
      expect(collectionNames).toEqual(["Personal Reading", "Work Research"]);

      // Verify collection details
      const workColl = urlCardResult?.collections.find(
        (c) => c.name === "Work Research"
      );
      expect(workColl?.authorId).toBe(curatorId.value);
      expect(workColl?.id).toBe(workCollection.collectionId.getStringValue());
    });
  });

  describe("sorting", () => {
    beforeEach(async () => {
      // Create URL cards with different properties for sorting
      const urls = [
        {
          url: "https://example.com/alpha",
          libraryCount: 1,
          date: "2023-01-01",
        },
        {
          url: "https://example.com/beta",
          libraryCount: 3,
          date: "2023-01-03",
        },
        {
          url: "https://example.com/gamma",
          libraryCount: 2,
          date: "2023-01-02",
        },
      ];

      for (const urlData of urls) {
        const url = URL.create(urlData.url).unwrap();
        const urlCard = new CardBuilder()
          .withCuratorId(curatorId.value)
          .withUrlCard(url)
          .withCreatedAt(new Date(urlData.date))
          .withUpdatedAt(new Date(urlData.date))
          .buildOrThrow();

        await cardRepository.save(urlCard);

        // Add to library using domain logic - add multiple users to reach the desired library count
        urlCard.addToLibrary(curatorId);
        await cardRepository.save(urlCard);

        // Add additional users to reach the test library count
        if (urlData.libraryCount > 1) {
          urlCard.addToLibrary(otherCuratorId);
          await cardRepository.save(urlCard);
        }
        if (urlData.libraryCount > 2) {
          urlCard.addToLibrary(thirdCuratorId);
          await cardRepository.save(urlCard);
        }
      }
    });

    it("should sort by library count descending", async () => {
      const result = await queryRepository.getUrlCardsOfUser(curatorId.value, {
        page: 1,
        limit: 10,
        sortBy: CardSortField.LIBRARY_COUNT,
        sortOrder: SortOrder.DESC,
      });

      expect(result.items).toHaveLength(3);
      expect(result.items[0]?.libraryCount).toBe(3); // beta
      expect(result.items[1]?.libraryCount).toBe(2); // gamma
      expect(result.items[2]?.libraryCount).toBe(1); // alpha
    });

    it("should sort by library count ascending", async () => {
      const result = await queryRepository.getUrlCardsOfUser(curatorId.value, {
        page: 1,
        limit: 10,
        sortBy: CardSortField.LIBRARY_COUNT,
        sortOrder: SortOrder.ASC,
      });

      expect(result.items).toHaveLength(3);
      expect(result.items[0]?.libraryCount).toBe(1); // alpha
      expect(result.items[1]?.libraryCount).toBe(2); // gamma
      expect(result.items[2]?.libraryCount).toBe(3); // beta
    });

    it("should sort by updated date descending", async () => {
      const result = await queryRepository.getUrlCardsOfUser(curatorId.value, {
        page: 1,
        limit: 10,
        sortBy: CardSortField.UPDATED_AT,
        sortOrder: SortOrder.DESC,
      });

      expect(result.items).toHaveLength(3);
      expect(result.items[0]!.updatedAt.getTime()).toBeGreaterThanOrEqual(
        result.items[1]!.updatedAt.getTime()
      );
      expect(result.items[1]!.updatedAt.getTime()).toBeGreaterThanOrEqual(
        result.items[2]!.updatedAt.getTime()
      );
    });
  });

  describe("pagination", () => {
    beforeEach(async () => {
      // Create 5 URL cards for pagination testing
      for (let i = 1; i <= 5; i++) {
        const url = URL.create(`https://example.com/article${i}`).unwrap();
        const urlCard = new CardBuilder()
          .withCuratorId(curatorId.value)
          .withUrlCard(url)
          .withCreatedAt(new Date(`2023-01-${i.toString().padStart(2, "0")}`))
          .withUpdatedAt(new Date(`2023-01-${i.toString().padStart(2, "0")}`))
          .buildOrThrow();

        await cardRepository.save(urlCard);

        // Add to library using domain logic
        urlCard.addToLibrary(curatorId);

        await cardRepository.save(urlCard);
      }
    });

    it("should handle pagination correctly", async () => {
      // First page
      const page1 = await queryRepository.getUrlCardsOfUser(curatorId.value, {
        page: 1,
        limit: 2,
        sortBy: CardSortField.UPDATED_AT,
        sortOrder: SortOrder.ASC,
      });

      expect(page1.items).toHaveLength(2);
      expect(page1.totalCount).toBe(5);
      expect(page1.hasMore).toBe(true);

      // Second page
      const page2 = await queryRepository.getUrlCardsOfUser(curatorId.value, {
        page: 2,
        limit: 2,
        sortBy: CardSortField.UPDATED_AT,
        sortOrder: SortOrder.ASC,
      });

      expect(page2.items).toHaveLength(2);
      expect(page2.totalCount).toBe(5);
      expect(page2.hasMore).toBe(true);

      // Third page (last page with 1 item)
      const page3 = await queryRepository.getUrlCardsOfUser(curatorId.value, {
        page: 3,
        limit: 2,
        sortBy: CardSortField.UPDATED_AT,
        sortOrder: SortOrder.ASC,
      });

      expect(page3.items).toHaveLength(1);
      expect(page3.totalCount).toBe(5);
      expect(page3.hasMore).toBe(false);
    });
  });
});
