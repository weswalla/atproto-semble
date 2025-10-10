import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import postgres from 'postgres';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DrizzleCardQueryRepository } from '../../infrastructure/repositories/DrizzleCardQueryRepository';
import { DrizzleCardRepository } from '../../infrastructure/repositories/DrizzleCardRepository';
import { CuratorId } from '../../domain/value-objects/CuratorId';
import { cards } from '../../infrastructure/repositories/schema/card.sql';
import {
  collections,
  collectionCards,
} from '../../infrastructure/repositories/schema/collection.sql';
import { libraryMemberships } from '../../infrastructure/repositories/schema/libraryMembership.sql';
import { publishedRecords } from '../../infrastructure/repositories/schema/publishedRecord.sql';
import { CardBuilder } from '../utils/builders/CardBuilder';
import { URL } from '../../domain/value-objects/URL';
import { CardSortField, SortOrder } from '../../domain/ICardQueryRepository';
import { createTestSchema } from '../test-utils/createTestSchema';

describe('DrizzleCardQueryRepository - getNoteCardsForUrl', () => {
  let container: StartedPostgreSqlContainer;
  let db: PostgresJsDatabase;
  let queryRepository: DrizzleCardQueryRepository;
  let cardRepository: DrizzleCardRepository;

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
    queryRepository = new DrizzleCardQueryRepository(db);
    cardRepository = new DrizzleCardRepository(db);

    // Create schema using helper function
    await createTestSchema(db);

    // Create test data
    curator1 = CuratorId.create('did:plc:testcurator1').unwrap();
    curator2 = CuratorId.create('did:plc:testcurator2').unwrap();
    curator3 = CuratorId.create('did:plc:testcurator3').unwrap();
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

  describe('getNoteCardsForUrl', () => {
    it('should return note cards from multiple users for the same URL', async () => {
      const testUrl = 'https://example.com/shared-article';
      const url = URL.create(testUrl).unwrap();

      // Create note cards for different users with the same URL
      const noteCard1 = new CardBuilder()
        .withCuratorId(curator1.value)
        .withNoteCard('First user note about the article')
        .withUrl(url)
        .withCreatedAt(new Date('2023-01-01'))
        .withUpdatedAt(new Date('2023-01-01'))
        .buildOrThrow();

      const noteCard2 = new CardBuilder()
        .withCuratorId(curator2.value)
        .withNoteCard('Second user note about the article')
        .withUrl(url)
        .withCreatedAt(new Date('2023-01-02'))
        .withUpdatedAt(new Date('2023-01-02'))
        .buildOrThrow();

      const noteCard3 = new CardBuilder()
        .withCuratorId(curator3.value)
        .withNoteCard('Third user note about the article')
        .withUrl(url)
        .withCreatedAt(new Date('2023-01-03'))
        .withUpdatedAt(new Date('2023-01-03'))
        .buildOrThrow();

      // Save note cards
      await cardRepository.save(noteCard1);
      await cardRepository.save(noteCard2);
      await cardRepository.save(noteCard3);

      // Query note cards
      const result = await queryRepository.getNoteCardsForUrl(testUrl, {
        page: 1,
        limit: 10,
        sortBy: CardSortField.UPDATED_AT,
        sortOrder: SortOrder.DESC,
      });

      expect(result.items).toHaveLength(3);
      expect(result.totalCount).toBe(3);
      expect(result.hasMore).toBe(false);

      // Check that all three users' notes are included
      const authorIds = result.items.map((note) => note.authorId);
      expect(authorIds).toContain(curator1.value);
      expect(authorIds).toContain(curator2.value);
      expect(authorIds).toContain(curator3.value);

      // Check note content
      const noteTexts = result.items.map((note) => note.note);
      expect(noteTexts).toContain('First user note about the article');
      expect(noteTexts).toContain('Second user note about the article');
      expect(noteTexts).toContain('Third user note about the article');

      // Check sorting (DESC by updatedAt)
      expect(result.items[0]!.note).toBe('Third user note about the article');
      expect(result.items[1]!.note).toBe('Second user note about the article');
      expect(result.items[2]!.note).toBe('First user note about the article');
    });

    it('should return empty result when no notes exist for the URL', async () => {
      const testUrl = 'https://example.com/nonexistent-article';

      const result = await queryRepository.getNoteCardsForUrl(testUrl, {
        page: 1,
        limit: 10,
        sortBy: CardSortField.UPDATED_AT,
        sortOrder: SortOrder.DESC,
      });

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should not return notes for different URLs', async () => {
      const testUrl1 = 'https://example.com/article1';
      const testUrl2 = 'https://example.com/article2';
      const url1 = URL.create(testUrl1).unwrap();
      const url2 = URL.create(testUrl2).unwrap();

      // Create note cards with different URLs
      const noteCard1 = new CardBuilder()
        .withCuratorId(curator1.value)
        .withNoteCard('Note for article 1')
        .withUrl(url1)
        .buildOrThrow();

      const noteCard2 = new CardBuilder()
        .withCuratorId(curator2.value)
        .withNoteCard('Note for article 2')
        .withUrl(url2)
        .buildOrThrow();

      await cardRepository.save(noteCard1);
      await cardRepository.save(noteCard2);

      // Query for testUrl1
      const result = await queryRepository.getNoteCardsForUrl(testUrl1, {
        page: 1,
        limit: 10,
        sortBy: CardSortField.UPDATED_AT,
        sortOrder: SortOrder.DESC,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.note).toBe('Note for article 1');
      expect(result.items[0]!.authorId).toBe(curator1.value);
    });

    it('should handle pagination correctly', async () => {
      const testUrl = 'https://example.com/popular-article';
      const url = URL.create(testUrl).unwrap();

      // Create 5 note cards with the same URL from different users
      for (let i = 1; i <= 5; i++) {
        const curator = CuratorId.create(`did:plc:curator${i}`).unwrap();

        const noteCard = new CardBuilder()
          .withCuratorId(curator.value)
          .withNoteCard(`Note ${i} about the article`)
          .withUrl(url)
          .withCreatedAt(new Date(`2023-01-0${i}`))
          .withUpdatedAt(new Date(`2023-01-0${i}`))
          .buildOrThrow();

        await cardRepository.save(noteCard);
      }

      // Test first page with limit 2
      const page1 = await queryRepository.getNoteCardsForUrl(testUrl, {
        page: 1,
        limit: 2,
        sortBy: CardSortField.CREATED_AT,
        sortOrder: SortOrder.ASC,
      });

      expect(page1.items).toHaveLength(2);
      expect(page1.totalCount).toBe(5);
      expect(page1.hasMore).toBe(true);
      expect(page1.items[0]!.note).toBe('Note 1 about the article');
      expect(page1.items[1]!.note).toBe('Note 2 about the article');

      // Test second page
      const page2 = await queryRepository.getNoteCardsForUrl(testUrl, {
        page: 2,
        limit: 2,
        sortBy: CardSortField.CREATED_AT,
        sortOrder: SortOrder.ASC,
      });

      expect(page2.items).toHaveLength(2);
      expect(page2.totalCount).toBe(5);
      expect(page2.hasMore).toBe(true);
      expect(page2.items[0]!.note).toBe('Note 3 about the article');
      expect(page2.items[1]!.note).toBe('Note 4 about the article');

      // Test last page
      const page3 = await queryRepository.getNoteCardsForUrl(testUrl, {
        page: 3,
        limit: 2,
        sortBy: CardSortField.CREATED_AT,
        sortOrder: SortOrder.ASC,
      });

      expect(page3.items).toHaveLength(1);
      expect(page3.totalCount).toBe(5);
      expect(page3.hasMore).toBe(false);
      expect(page3.items[0]!.note).toBe('Note 5 about the article');
    });

    it('should sort by createdAt ascending', async () => {
      const testUrl = 'https://example.com/test-article';
      const url = URL.create(testUrl).unwrap();

      const noteCard1 = new CardBuilder()
        .withCuratorId(curator1.value)
        .withNoteCard('First note')
        .withUrl(url)
        .withCreatedAt(new Date('2023-01-03'))
        .buildOrThrow();

      const noteCard2 = new CardBuilder()
        .withCuratorId(curator2.value)
        .withNoteCard('Second note')
        .withUrl(url)
        .withCreatedAt(new Date('2023-01-01'))
        .buildOrThrow();

      const noteCard3 = new CardBuilder()
        .withCuratorId(curator3.value)
        .withNoteCard('Third note')
        .withUrl(url)
        .withCreatedAt(new Date('2023-01-02'))
        .buildOrThrow();

      await cardRepository.save(noteCard1);
      await cardRepository.save(noteCard2);
      await cardRepository.save(noteCard3);

      const result = await queryRepository.getNoteCardsForUrl(testUrl, {
        page: 1,
        limit: 10,
        sortBy: CardSortField.CREATED_AT,
        sortOrder: SortOrder.ASC,
      });

      expect(result.items).toHaveLength(3);
      expect(result.items[0]!.note).toBe('Second note');
      expect(result.items[1]!.note).toBe('Third note');
      expect(result.items[2]!.note).toBe('First note');
    });
  });
});
