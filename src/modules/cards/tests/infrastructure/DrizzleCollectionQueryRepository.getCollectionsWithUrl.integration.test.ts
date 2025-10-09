import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import postgres from 'postgres';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DrizzleCollectionQueryRepository } from '../../infrastructure/repositories/DrizzleCollectionQueryRepository';
import { DrizzleCardRepository } from '../../infrastructure/repositories/DrizzleCardRepository';
import { DrizzleCollectionRepository } from '../../infrastructure/repositories/DrizzleCollectionRepository';
import { CuratorId } from '../../domain/value-objects/CuratorId';
import { cards } from '../../infrastructure/repositories/schema/card.sql';
import {
  collections,
  collectionCards,
} from '../../infrastructure/repositories/schema/collection.sql';
import { libraryMemberships } from '../../infrastructure/repositories/schema/libraryMembership.sql';
import { publishedRecords } from '../../infrastructure/repositories/schema/publishedRecord.sql';
import { CardBuilder } from '../utils/builders/CardBuilder';
import { CollectionBuilder } from '../utils/builders/CollectionBuilder';
import { URL } from '../../domain/value-objects/URL';
import { createTestSchema } from '../test-utils/createTestSchema';
import { CardTypeEnum } from '../../domain/value-objects/CardType';
import { PublishedRecordId } from '../../domain/value-objects/PublishedRecordId';

describe('DrizzleCollectionQueryRepository - getCollectionsWithUrl', () => {
  let container: StartedPostgreSqlContainer;
  let db: PostgresJsDatabase;
  let queryRepository: DrizzleCollectionQueryRepository;
  let cardRepository: DrizzleCardRepository;
  let collectionRepository: DrizzleCollectionRepository;

  // Test data
  let curator1: CuratorId;
  let curator2: CuratorId;
  let curator3: CuratorId;

  // Setup before all tests
  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer('postgres:14').start();

    // Create database connection
    const connectionString = container.getConnectionUri();
    process.env.DATABASE_URL = connectionString;
    const client = postgres(connectionString);
    db = drizzle(client);

    // Create repositories
    queryRepository = new DrizzleCollectionQueryRepository(db);
    cardRepository = new DrizzleCardRepository(db);
    collectionRepository = new DrizzleCollectionRepository(db);

    // Create schema using helper function
    await createTestSchema(db);

    // Create test data
    curator1 = CuratorId.create('did:plc:curator1').unwrap();
    curator2 = CuratorId.create('did:plc:curator2').unwrap();
    curator3 = CuratorId.create('did:plc:curator3').unwrap();
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

  describe('Collections with URL cards', () => {
    it('should return all collections containing cards with the specified URL', async () => {
      const testUrl = 'https://example.com/shared-article';
      const url = URL.create(testUrl).unwrap();

      // Create URL cards for different users with the same URL
      const card1 = new CardBuilder()
        .withCuratorId(curator1.value)
        .withType(CardTypeEnum.URL)
        .withUrl(url)
        .buildOrThrow();

      const card2 = new CardBuilder()
        .withCuratorId(curator2.value)
        .withType(CardTypeEnum.URL)
        .withUrl(url)
        .buildOrThrow();

      const card3 = new CardBuilder()
        .withCuratorId(curator3.value)
        .withType(CardTypeEnum.URL)
        .withUrl(url)
        .buildOrThrow();

      // Add cards to their respective libraries
      card1.addToLibrary(curator1);
      card2.addToLibrary(curator2);
      card3.addToLibrary(curator3);

      await cardRepository.save(card1);
      await cardRepository.save(card2);
      await cardRepository.save(card3);

      // Create collections for each user and add their cards
      const collection1 = new CollectionBuilder()
        .withAuthorId(curator1.value)
        .withName('Tech Articles')
        .withDescription('My tech articles')
        .buildOrThrow();

      const collection2 = new CollectionBuilder()
        .withAuthorId(curator2.value)
        .withName('Reading List')
        .withDescription('Articles to read')
        .buildOrThrow();

      const collection3 = new CollectionBuilder()
        .withAuthorId(curator3.value)
        .withName('Favorites')
        .buildOrThrow();

      // Add cards to collections
      collection1.addCard(card1.cardId, curator1);
      collection2.addCard(card2.cardId, curator2);
      collection3.addCard(card3.cardId, curator3);

      // Mark collections as published
      const publishedRecordId1 = PublishedRecordId.create({
        uri: 'at://did:plc:curator1/network.cosmik.collection/collection1',
        cid: 'bafyreicollection1',
      });
      const publishedRecordId2 = PublishedRecordId.create({
        uri: 'at://did:plc:curator2/network.cosmik.collection/collection2',
        cid: 'bafyreicollection2',
      });
      const publishedRecordId3 = PublishedRecordId.create({
        uri: 'at://did:plc:curator3/network.cosmik.collection/collection3',
        cid: 'bafyreicollection3',
      });

      collection1.markAsPublished(publishedRecordId1);
      collection2.markAsPublished(publishedRecordId2);
      collection3.markAsPublished(publishedRecordId3);

      await collectionRepository.save(collection1);
      await collectionRepository.save(collection2);
      await collectionRepository.save(collection3);

      // Execute the query
      const result = await queryRepository.getCollectionsWithUrl(testUrl, {
        page: 1,
        limit: 10,
      });

      // Verify the result
      expect(result.items).toHaveLength(3);
      expect(result.totalCount).toBe(3);
      expect(result.hasMore).toBe(false);

      // Check that all three collections are included
      const collectionIds = result.items.map((c) => c.id);
      expect(collectionIds).toContain(
        collection1.collectionId.getStringValue(),
      );
      expect(collectionIds).toContain(
        collection2.collectionId.getStringValue(),
      );
      expect(collectionIds).toContain(
        collection3.collectionId.getStringValue(),
      );

      // Verify collection details
      const techArticles = result.items.find((c) => c.name === 'Tech Articles');
      expect(techArticles).toBeDefined();
      expect(techArticles?.description).toBe('My tech articles');
      expect(techArticles?.authorId).toBe(curator1.value);
      expect(techArticles?.uri).toBe(
        'at://did:plc:curator1/network.cosmik.collection/collection1',
      );

      const readingList = result.items.find((c) => c.name === 'Reading List');
      expect(readingList).toBeDefined();
      expect(readingList?.description).toBe('Articles to read');
      expect(readingList?.authorId).toBe(curator2.value);

      const favorites = result.items.find((c) => c.name === 'Favorites');
      expect(favorites).toBeDefined();
      expect(favorites?.description).toBeUndefined();
      expect(favorites?.authorId).toBe(curator3.value);
    });

    it('should return empty array when no collections contain cards with the specified URL', async () => {
      const testUrl = 'https://example.com/nonexistent-article';

      const result = await queryRepository.getCollectionsWithUrl(testUrl, {
        page: 1,
        limit: 10,
      });

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should not return collections that contain cards with different URLs', async () => {
      const testUrl1 = 'https://example.com/article1';
      const testUrl2 = 'https://example.com/article2';
      const url1 = URL.create(testUrl1).unwrap();
      const url2 = URL.create(testUrl2).unwrap();

      // Create cards with different URLs
      const card1 = new CardBuilder()
        .withCuratorId(curator1.value)
        .withType(CardTypeEnum.URL)
        .withUrl(url1)
        .buildOrThrow();

      const card2 = new CardBuilder()
        .withCuratorId(curator2.value)
        .withType(CardTypeEnum.URL)
        .withUrl(url2)
        .buildOrThrow();

      card1.addToLibrary(curator1);
      card2.addToLibrary(curator2);

      await cardRepository.save(card1);
      await cardRepository.save(card2);

      // Create collections
      const collection1 = new CollectionBuilder()
        .withAuthorId(curator1.value)
        .withName('Collection 1')
        .buildOrThrow();

      const collection2 = new CollectionBuilder()
        .withAuthorId(curator2.value)
        .withName('Collection 2')
        .buildOrThrow();

      collection1.addCard(card1.cardId, curator1);
      collection2.addCard(card2.cardId, curator2);

      await collectionRepository.save(collection1);
      await collectionRepository.save(collection2);

      // Query for testUrl1
      const result = await queryRepository.getCollectionsWithUrl(testUrl1, {
        page: 1,
        limit: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.name).toBe('Collection 1');
      expect(result.items[0]!.authorId).toBe(curator1.value);
    });

    it('should return multiple collections from the same user if they contain the URL', async () => {
      const testUrl = 'https://example.com/popular-article';
      const url = URL.create(testUrl).unwrap();

      // Create URL card
      const card = new CardBuilder()
        .withCuratorId(curator1.value)
        .withType(CardTypeEnum.URL)
        .withUrl(url)
        .buildOrThrow();

      card.addToLibrary(curator1);
      await cardRepository.save(card);

      // Create multiple collections for the same user
      const collection1 = new CollectionBuilder()
        .withAuthorId(curator1.value)
        .withName('Tech')
        .buildOrThrow();

      const collection2 = new CollectionBuilder()
        .withAuthorId(curator1.value)
        .withName('Favorites')
        .buildOrThrow();

      const collection3 = new CollectionBuilder()
        .withAuthorId(curator1.value)
        .withName('To Read')
        .buildOrThrow();

      // Add the same card to all collections
      collection1.addCard(card.cardId, curator1);
      collection2.addCard(card.cardId, curator1);
      collection3.addCard(card.cardId, curator1);

      await collectionRepository.save(collection1);
      await collectionRepository.save(collection2);
      await collectionRepository.save(collection3);

      // Execute the query
      const result = await queryRepository.getCollectionsWithUrl(testUrl, {
        page: 1,
        limit: 10,
      });

      expect(result.items).toHaveLength(3);

      const collectionNames = result.items.map((c) => c.name);
      expect(collectionNames).toContain('Tech');
      expect(collectionNames).toContain('Favorites');
      expect(collectionNames).toContain('To Read');

      // All should have the same author
      result.items.forEach((collection) => {
        expect(collection.authorId).toBe(curator1.value);
      });
    });

    it('should handle collections without published record IDs', async () => {
      const testUrl = 'https://example.com/unpublished-article';
      const url = URL.create(testUrl).unwrap();

      // Create URL card
      const card = new CardBuilder()
        .withCuratorId(curator1.value)
        .withType(CardTypeEnum.URL)
        .withUrl(url)
        .buildOrThrow();

      card.addToLibrary(curator1);
      await cardRepository.save(card);

      // Create collection without publishing it
      const collection = new CollectionBuilder()
        .withAuthorId(curator1.value)
        .withName('Unpublished Collection')
        .buildOrThrow();

      collection.addCard(card.cardId, curator1);
      await collectionRepository.save(collection);

      // Execute the query
      const result = await queryRepository.getCollectionsWithUrl(testUrl, {
        page: 1,
        limit: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.name).toBe('Unpublished Collection');
      expect(result.items[0]!.uri).toBeUndefined();
    });

    it('should handle multiple cards with same URL from different users in same collection', async () => {
      const testUrl = 'https://example.com/shared-article';
      const url = URL.create(testUrl).unwrap();

      // Create URL cards for different users with the same URL
      const card1 = new CardBuilder()
        .withCuratorId(curator1.value)
        .withType(CardTypeEnum.URL)
        .withUrl(url)
        .buildOrThrow();

      const card2 = new CardBuilder()
        .withCuratorId(curator2.value)
        .withType(CardTypeEnum.URL)
        .withUrl(url)
        .buildOrThrow();

      card1.addToLibrary(curator1);
      card2.addToLibrary(curator2);

      await cardRepository.save(card1);
      await cardRepository.save(card2);

      // Create one collection that contains both cards
      const collection = new CollectionBuilder()
        .withAuthorId(curator1.value)
        .withName('Shared Collection')
        .buildOrThrow();

      collection.addCard(card1.cardId, curator1);
      collection.addCard(card2.cardId, curator1);

      await collectionRepository.save(collection);

      // Execute the query
      const result = await queryRepository.getCollectionsWithUrl(testUrl, {
        page: 1,
        limit: 10,
      });

      // Should return the collection only once, even though it has multiple cards with the URL
      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.name).toBe('Shared Collection');
      expect(result.items[0]!.authorId).toBe(curator1.value);
    });

    it('should not return collections containing NOTE cards with the URL', async () => {
      const testUrl = 'https://example.com/article';
      const url = URL.create(testUrl).unwrap();

      // Create URL card
      const urlCard = new CardBuilder()
        .withCuratorId(curator1.value)
        .withType(CardTypeEnum.URL)
        .withUrl(url)
        .buildOrThrow();

      // Create NOTE card with same URL (edge case)
      const noteCard = new CardBuilder()
        .withCuratorId(curator2.value)
        .withType(CardTypeEnum.NOTE)
        .withUrl(url)
        .buildOrThrow();

      urlCard.addToLibrary(curator1);
      noteCard.addToLibrary(curator2);

      await cardRepository.save(urlCard);
      await cardRepository.save(noteCard);

      // Create collections
      const collection1 = new CollectionBuilder()
        .withAuthorId(curator1.value)
        .withName('URL Collection')
        .buildOrThrow();

      const collection2 = new CollectionBuilder()
        .withAuthorId(curator2.value)
        .withName('Note Collection')
        .buildOrThrow();

      collection1.addCard(urlCard.cardId, curator1);
      collection2.addCard(noteCard.cardId, curator2);

      await collectionRepository.save(collection1);
      await collectionRepository.save(collection2);

      const result = await queryRepository.getCollectionsWithUrl(testUrl, {
        page: 1,
        limit: 10,
      });

      // Should only return the collection with the URL card, not the NOTE card
      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.name).toBe('URL Collection');
      expect(result.items[0]!.authorId).toBe(curator1.value);
    });

    it('should handle cards not in any collection', async () => {
      const testUrl = 'https://example.com/article';
      const url = URL.create(testUrl).unwrap();

      // Create URL card but don't add to any collection
      const card = new CardBuilder()
        .withCuratorId(curator1.value)
        .withType(CardTypeEnum.URL)
        .withUrl(url)
        .buildOrThrow();

      card.addToLibrary(curator1);
      await cardRepository.save(card);

      const result = await queryRepository.getCollectionsWithUrl(testUrl, {
        page: 1,
        limit: 10,
      });

      // Should return empty since card is not in any collection
      expect(result.items).toHaveLength(0);
    });

    it('should return collections sorted alphabetically by name', async () => {
      const testUrl = 'https://example.com/article';
      const url = URL.create(testUrl).unwrap();

      // Create URL cards
      const card1 = new CardBuilder()
        .withCuratorId(curator1.value)
        .withType(CardTypeEnum.URL)
        .withUrl(url)
        .buildOrThrow();

      const card2 = new CardBuilder()
        .withCuratorId(curator2.value)
        .withType(CardTypeEnum.URL)
        .withUrl(url)
        .buildOrThrow();

      const card3 = new CardBuilder()
        .withCuratorId(curator3.value)
        .withType(CardTypeEnum.URL)
        .withUrl(url)
        .buildOrThrow();

      card1.addToLibrary(curator1);
      card2.addToLibrary(curator2);
      card3.addToLibrary(curator3);

      await cardRepository.save(card1);
      await cardRepository.save(card2);
      await cardRepository.save(card3);

      // Create collections with names that should be sorted
      const collectionZ = new CollectionBuilder()
        .withAuthorId(curator1.value)
        .withName('Zebra Collection')
        .buildOrThrow();

      const collectionA = new CollectionBuilder()
        .withAuthorId(curator2.value)
        .withName('Apple Collection')
        .buildOrThrow();

      const collectionM = new CollectionBuilder()
        .withAuthorId(curator3.value)
        .withName('Mango Collection')
        .buildOrThrow();

      collectionZ.addCard(card1.cardId, curator1);
      collectionA.addCard(card2.cardId, curator2);
      collectionM.addCard(card3.cardId, curator3);

      await collectionRepository.save(collectionZ);
      await collectionRepository.save(collectionA);
      await collectionRepository.save(collectionM);

      const result = await queryRepository.getCollectionsWithUrl(testUrl, {
        page: 1,
        limit: 10,
      });

      expect(result.items).toHaveLength(3);
      expect(result.items[0]!.name).toBe('Apple Collection');
      expect(result.items[1]!.name).toBe('Mango Collection');
      expect(result.items[2]!.name).toBe('Zebra Collection');
    });
  });

  describe('Pagination', () => {
    it('should paginate results correctly', async () => {
      const testUrl = 'https://example.com/popular-article';
      const url = URL.create(testUrl).unwrap();

      // Create 5 cards with the same URL from different users
      const cards = [];
      const curators = [];
      const collections = [];

      for (let i = 1; i <= 5; i++) {
        const curator = CuratorId.create(`did:plc:curator${i}`).unwrap();
        curators.push(curator);

        const card = new CardBuilder()
          .withCuratorId(curator.value)
          .withType(CardTypeEnum.URL)
          .withUrl(url)
          .buildOrThrow();

        card.addToLibrary(curator);
        cards.push(card);
        await cardRepository.save(card);

        // Create collection for each user
        const collection = new CollectionBuilder()
          .withAuthorId(curator.value)
          .withName(`Collection ${i}`)
          .buildOrThrow();

        collection.addCard(card.cardId, curator);
        collections.push(collection);
        await collectionRepository.save(collection);
      }

      // Test first page with limit 2
      const result1 = await queryRepository.getCollectionsWithUrl(testUrl, {
        page: 1,
        limit: 2,
      });

      expect(result1.items).toHaveLength(2);
      expect(result1.totalCount).toBe(5);
      expect(result1.hasMore).toBe(true);

      // Test second page
      const result2 = await queryRepository.getCollectionsWithUrl(testUrl, {
        page: 2,
        limit: 2,
      });

      expect(result2.items).toHaveLength(2);
      expect(result2.totalCount).toBe(5);
      expect(result2.hasMore).toBe(true);

      // Test last page
      const result3 = await queryRepository.getCollectionsWithUrl(testUrl, {
        page: 3,
        limit: 2,
      });

      expect(result3.items).toHaveLength(1);
      expect(result3.totalCount).toBe(5);
      expect(result3.hasMore).toBe(false);

      // Verify no duplicate entries across pages
      const allCollectionIds = [
        ...result1.items.map((c) => c.id),
        ...result2.items.map((c) => c.id),
        ...result3.items.map((c) => c.i),
      ];
      const uniqueCollectionIds = [...new Set(allCollectionIds)];
      expect(uniqueCollectionIds).toHaveLength(5);
    });

    it('should handle empty pages correctly', async () => {
      const testUrl = 'https://example.com/empty-test';

      const result = await queryRepository.getCollectionsWithUrl(testUrl, {
        page: 2,
        limit: 10,
      });

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should handle large page numbers gracefully', async () => {
      const testUrl = 'https://example.com/single-collection';
      const url = URL.create(testUrl).unwrap();

      // Create single card and collection
      const card = new CardBuilder()
        .withCuratorId(curator1.value)
        .withType(CardTypeEnum.URL)
        .withUrl(url)
        .buildOrThrow();

      card.addToLibrary(curator1);
      await cardRepository.save(card);

      const collection = new CollectionBuilder()
        .withAuthorId(curator1.value)
        .withName('Single Collection')
        .buildOrThrow();

      collection.addCard(card.cardId, curator1);
      await collectionRepository.save(collection);

      // Request page 10 when there's only 1 item
      const result = await queryRepository.getCollectionsWithUrl(testUrl, {
        page: 10,
        limit: 10,
      });

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(1);
      expect(result.hasMore).toBe(false);
    });
  });
});
