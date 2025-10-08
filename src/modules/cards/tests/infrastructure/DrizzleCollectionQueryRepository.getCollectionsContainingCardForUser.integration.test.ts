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
import { UniqueEntityID } from '../../../../shared/domain/UniqueEntityID';
import {
  collections,
  collectionCollaborators,
  collectionCards,
} from '../../infrastructure/repositories/schema/collection.sql';
import { cards } from '../../infrastructure/repositories/schema/card.sql';
import { libraryMemberships } from '../../infrastructure/repositories/schema/libraryMembership.sql';
import { publishedRecords } from '../../infrastructure/repositories/schema/publishedRecord.sql';
import { Collection, CollectionAccessType } from '../../domain/Collection';
import { CardFactory } from '../../domain/CardFactory';
import { CardTypeEnum } from '../../domain/value-objects/CardType';
import { PublishedRecordId } from '../../domain/value-objects/PublishedRecordId';
import { URL } from '../../domain/value-objects/URL';
import { createTestSchema } from '../test-utils/createTestSchema';

describe('DrizzleCollectionQueryRepository - getCollectionsContainingCardForUser', () => {
  let container: StartedPostgreSqlContainer;
  let db: PostgresJsDatabase;
  let queryRepository: DrizzleCollectionQueryRepository;
  let collectionRepository: DrizzleCollectionRepository;
  let cardRepository: DrizzleCardRepository;

  // Test data
  let curatorId: CuratorId;
  let otherCuratorId: CuratorId;

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
    collectionRepository = new DrizzleCollectionRepository(db);
    cardRepository = new DrizzleCardRepository(db);

    // Create schema using helper function
    await createTestSchema(db);

    // Create test data
    curatorId = CuratorId.create('did:plc:testcurator').unwrap();
    otherCuratorId = CuratorId.create('did:plc:othercurator').unwrap();
  }, 60000); // Increase timeout for container startup

  // Cleanup after all tests
  afterAll(async () => {
    // Stop container
    await container.stop();
  });

  // Clear data between tests
  beforeEach(async () => {
    await db.delete(collectionCards);
    await db.delete(collectionCollaborators);
    await db.delete(collections);
    await db.delete(libraryMemberships);
    await db.delete(cards);
    await db.delete(publishedRecords);
  });

  describe('URL card in collections', () => {
    it('should return collections when user has URL card in multiple collections', async () => {
      const testUrl = 'https://example.com/test-article';

      // Create a URL card
      const url = URL.create(testUrl).unwrap();
      const card = CardFactory.create({
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.URL,
          url: url.value,
        },
      }).unwrap();

      // Add card to library
      const addToLibResult = card.addToLibrary(curatorId);
      expect(addToLibResult.isOk()).toBe(true);

      await cardRepository.save(card);

      // Create first collection
      const collection1 = Collection.create(
        {
          authorId: curatorId,
          name: 'Tech Articles',
          description: 'Collection of technology articles',
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        new UniqueEntityID(),
      ).unwrap();

      // Create second collection
      const collection2 = Collection.create(
        {
          authorId: curatorId,
          name: 'Reading List',
          description: 'My personal reading list',
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        new UniqueEntityID(),
      ).unwrap();

      // Add card to both collections
      const addToCollection1Result = collection1.addCard(card.cardId, curatorId);
      expect(addToCollection1Result.isOk()).toBe(true);

      const addToCollection2Result = collection2.addCard(card.cardId, curatorId);
      expect(addToCollection2Result.isOk()).toBe(true);

      // Mark collections as published
      const collection1PublishedRecordId = PublishedRecordId.create({
        uri: 'at://did:plc:testcurator/network.cosmik.collection/collection1',
        cid: 'bafyreicollection1cid',
      });

      const collection2PublishedRecordId = PublishedRecordId.create({
        uri: 'at://did:plc:testcurator/network.cosmik.collection/collection2',
        cid: 'bafyreicollection2cid',
      });

      collection1.markAsPublished(collection1PublishedRecordId);
      collection2.markAsPublished(collection2PublishedRecordId);

      // Save collections
      await collectionRepository.save(collection1);
      await collectionRepository.save(collection2);

      // Execute the query
      const result = await queryRepository.getCollectionsContainingCardForUser(
        card.cardId.getStringValue(),
        curatorId.value,
      );

      // Verify the result
      expect(result).toHaveLength(2);

      // Sort by name for consistent testing
      result.sort((a, b) => a.name.localeCompare(b.name));

      // Verify collection details
      expect(result[0]?.id).toBe(collection2.collectionId.getStringValue()); // Reading List comes first alphabetically
      expect(result[0]?.uri).toBe('at://did:plc:testcurator/network.cosmik.collection/collection2');
      expect(result[0]?.name).toBe('Reading List');
      expect(result[0]?.description).toBe('My personal reading list');

      expect(result[1]?.id).toBe(collection1.collectionId.getStringValue()); // Tech Articles comes second
      expect(result[1]?.uri).toBe('at://did:plc:testcurator/network.cosmik.collection/collection1');
      expect(result[1]?.name).toBe('Tech Articles');
      expect(result[1]?.description).toBe('Collection of technology articles');
    });

    it('should return empty array when user has URL card but not in any collections', async () => {
      const testUrl = 'https://example.com/standalone-article';

      // Create a URL card
      const url = URL.create(testUrl).unwrap();
      const card = CardFactory.create({
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.URL,
          url: url.value,
        },
      }).unwrap();

      // Add card to library
      const addToLibResult = card.addToLibrary(curatorId);
      expect(addToLibResult.isOk()).toBe(true);

      await cardRepository.save(card);

      // Execute the query
      const result = await queryRepository.getCollectionsContainingCardForUser(
        card.cardId.getStringValue(),
        curatorId.value,
      );

      // Verify the result
      expect(result).toHaveLength(0);
    });

    it('should return empty array when card does not exist', async () => {
      const nonExistentCardId = new UniqueEntityID().toString();

      // Execute the query
      const result = await queryRepository.getCollectionsContainingCardForUser(
        nonExistentCardId,
        curatorId.value,
      );

      // Verify the result
      expect(result).toHaveLength(0);
    });

    it('should not return collections from other users even if they have the same card', async () => {
      const testUrl = 'https://example.com/shared-article';

      // Create URL card for first user
      const url = URL.create(testUrl).unwrap();
      const card1 = CardFactory.create({
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.URL,
          url: url.value,
        },
      }).unwrap();

      const addToLibResult1 = card1.addToLibrary(curatorId);
      expect(addToLibResult1.isOk()).toBe(true);

      await cardRepository.save(card1);

      // Create URL card for second user (different card, same URL)
      const card2 = CardFactory.create({
        curatorId: otherCuratorId.value,
        cardInput: {
          type: CardTypeEnum.URL,
          url: url.value,
        },
      }).unwrap();

      const addToLibResult2 = card2.addToLibrary(otherCuratorId);
      expect(addToLibResult2.isOk()).toBe(true);

      await cardRepository.save(card2);

      // Create collection for second user and add their card
      const otherUserCollection = Collection.create(
        {
          authorId: otherCuratorId,
          name: 'Other User Collection',
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        new UniqueEntityID(),
      ).unwrap();

      const addToOtherCollectionResult = otherUserCollection.addCard(
        card2.cardId,
        otherCuratorId,
      );
      expect(addToOtherCollectionResult.isOk()).toBe(true);

      await collectionRepository.save(otherUserCollection);

      // Execute the query for first user's card
      const result = await queryRepository.getCollectionsContainingCardForUser(
        card1.cardId.getStringValue(),
        curatorId.value,
      );

      // Verify the result - should be empty since first user's card is not in any collections
      expect(result).toHaveLength(0);
    });

    it('should only return collections owned by the requesting user', async () => {
      const testUrl = 'https://example.com/multi-user-article';

      // Create URL card for the user
      const url = URL.create(testUrl).unwrap();
      const card = CardFactory.create({
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.URL,
          url: url.value,
        },
      }).unwrap();

      const addToLibResult = card.addToLibrary(curatorId);
      expect(addToLibResult.isOk()).toBe(true);

      await cardRepository.save(card);

      // Create user's own collection
      const userCollection = Collection.create(
        {
          authorId: curatorId,
          name: 'My Collection',
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        new UniqueEntityID(),
      ).unwrap();

      const addToUserCollectionResult = userCollection.addCard(
        card.cardId,
        curatorId,
      );
      expect(addToUserCollectionResult.isOk()).toBe(true);

      await collectionRepository.save(userCollection);

      // Create another user's collection (this should not appear in results)
      const otherUserCollection = Collection.create(
        {
          authorId: otherCuratorId,
          name: 'Other User Collection',
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        new UniqueEntityID(),
      ).unwrap();

      // Note: We don't add the card to the other user's collection since they can't add
      // another user's card to their collection in this domain model

      await collectionRepository.save(otherUserCollection);

      // Execute the query
      const result = await queryRepository.getCollectionsContainingCardForUser(
        card.cardId.getStringValue(),
        curatorId.value,
      );

      // Verify the result - should only see user's own collection
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('My Collection');
      expect(result[0]?.id).toBe(userCollection.collectionId.getStringValue());
    });
  });

  describe('Note cards in collections', () => {
    it('should return collections containing note cards', async () => {
      // Create a note card
      const card = CardFactory.create({
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.NOTE,
          text: 'This is a test note',
        },
      }).unwrap();

      // Add card to library
      const addToLibResult = card.addToLibrary(curatorId);
      expect(addToLibResult.isOk()).toBe(true);

      await cardRepository.save(card);

      // Create collection
      const collection = Collection.create(
        {
          authorId: curatorId,
          name: 'My Notes',
          description: 'Collection of my personal notes',
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        new UniqueEntityID(),
      ).unwrap();

      // Add card to collection
      const addToCollectionResult = collection.addCard(card.cardId, curatorId);
      expect(addToCollectionResult.isOk()).toBe(true);

      await collectionRepository.save(collection);

      // Execute the query
      const result = await queryRepository.getCollectionsContainingCardForUser(
        card.cardId.getStringValue(),
        curatorId.value,
      );

      // Verify the result
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(collection.collectionId.getStringValue());
      expect(result[0]?.name).toBe('My Notes');
      expect(result[0]?.description).toBe('Collection of my personal notes');
      expect(result[0]?.uri).toBeUndefined(); // Not published
    });

    it('should handle collections with and without descriptions', async () => {
      // Create a note card
      const card = CardFactory.create({
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.NOTE,
          text: 'Test note for collections',
        },
      }).unwrap();

      await cardRepository.save(card);

      // Create collection with description
      const collectionWithDesc = Collection.create(
        {
          authorId: curatorId,
          name: 'Collection With Description',
          description: 'This collection has a description',
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        new UniqueEntityID(),
      ).unwrap();

      // Create collection without description
      const collectionWithoutDesc = Collection.create(
        {
          authorId: curatorId,
          name: 'Collection Without Description',
          // No description provided
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        new UniqueEntityID(),
      ).unwrap();

      // Add card to both collections
      collectionWithDesc.addCard(card.cardId, curatorId);
      collectionWithoutDesc.addCard(card.cardId, curatorId);

      await collectionRepository.save(collectionWithDesc);
      await collectionRepository.save(collectionWithoutDesc);

      // Execute the query
      const result = await queryRepository.getCollectionsContainingCardForUser(
        card.cardId.getStringValue(),
        curatorId.value,
      );

      // Verify the result
      expect(result).toHaveLength(2);

      // Sort by name for consistent testing
      result.sort((a, b) => a.name.localeCompare(b.name));

      expect(result[0]?.name).toBe('Collection With Description');
      expect(result[0]?.description).toBe('This collection has a description');

      expect(result[1]?.name).toBe('Collection Without Description');
      expect(result[1]?.description).toBeUndefined();
    });
  });

  describe('Published and unpublished collections', () => {
    it('should return URI for published collections and undefined for unpublished', async () => {
      // Create a card
      const card = CardFactory.create({
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.NOTE,
          text: 'Card for published/unpublished test',
        },
      }).unwrap();

      await cardRepository.save(card);

      // Create published collection
      const publishedCollection = Collection.create(
        {
          authorId: curatorId,
          name: 'Published Collection',
          description: 'This collection is published',
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        new UniqueEntityID(),
      ).unwrap();

      // Create unpublished collection
      const unpublishedCollection = Collection.create(
        {
          authorId: curatorId,
          name: 'Unpublished Collection',
          description: 'This collection is not published',
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        new UniqueEntityID(),
      ).unwrap();

      // Mark published collection as published
      const publishedRecordId = PublishedRecordId.create({
        uri: 'at://did:plc:testcurator/network.cosmik.collection/published123',
        cid: 'bafyreipublishedcid',
      });

      publishedCollection.markAsPublished(publishedRecordId);

      // Add card to both collections
      publishedCollection.addCard(card.cardId, curatorId);
      unpublishedCollection.addCard(card.cardId, curatorId);

      await collectionRepository.save(publishedCollection);
      await collectionRepository.save(unpublishedCollection);

      // Execute the query
      const result = await queryRepository.getCollectionsContainingCardForUser(
        card.cardId.getStringValue(),
        curatorId.value,
      );

      // Verify the result
      expect(result).toHaveLength(2);

      // Find collections by name
      const publishedResult = result.find(c => c.name === 'Published Collection');
      const unpublishedResult = result.find(c => c.name === 'Unpublished Collection');

      expect(publishedResult?.uri).toBe('at://did:plc:testcurator/network.cosmik.collection/published123');
      expect(unpublishedResult?.uri).toBeUndefined();
    });
  });

  describe('Sorting and ordering', () => {
    it('should return collections sorted by name in ascending order', async () => {
      // Create a card
      const card = CardFactory.create({
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.NOTE,
          text: 'Card for sorting test',
        },
      }).unwrap();

      await cardRepository.save(card);

      // Create collections with names that will test alphabetical sorting
      const collectionNames = ['Zebra Collection', 'Alpha Collection', 'Beta Collection'];
      
      for (const name of collectionNames) {
        const collection = Collection.create(
          {
            authorId: curatorId,
            name,
            accessType: CollectionAccessType.OPEN,
            collaboratorIds: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          new UniqueEntityID(),
        ).unwrap();

        collection.addCard(card.cardId, curatorId);
        await collectionRepository.save(collection);
      }

      // Execute the query
      const result = await queryRepository.getCollectionsContainingCardForUser(
        card.cardId.getStringValue(),
        curatorId.value,
      );

      // Verify the result is sorted by name
      expect(result).toHaveLength(3);
      expect(result[0]?.name).toBe('Alpha Collection');
      expect(result[1]?.name).toBe('Beta Collection');
      expect(result[2]?.name).toBe('Zebra Collection');
    });
  });

  describe('Edge cases', () => {
    it('should handle non-existent curator gracefully', async () => {
      const card = CardFactory.create({
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.NOTE,
          text: 'Test card',
        },
      }).unwrap();

      await cardRepository.save(card);

      // Execute the query with non-existent curator
      const result = await queryRepository.getCollectionsContainingCardForUser(
        card.cardId.getStringValue(),
        'did:plc:nonexistent',
      );

      // Verify the result
      expect(result).toHaveLength(0);
    });

    it('should handle invalid card ID format gracefully', async () => {
      // Execute the query with invalid card ID
      const result = await queryRepository.getCollectionsContainingCardForUser(
        'invalid-card-id',
        curatorId.value,
      );

      // Verify the result
      expect(result).toHaveLength(0);
    });

    it('should handle empty curator ID gracefully', async () => {
      const card = CardFactory.create({
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.NOTE,
          text: 'Test card',
        },
      }).unwrap();

      await cardRepository.save(card);

      // Execute the query with empty curator ID
      const result = await queryRepository.getCollectionsContainingCardForUser(
        card.cardId.getStringValue(),
        '',
      );

      // Verify the result
      expect(result).toHaveLength(0);
    });

    it('should handle collections with null published records', async () => {
      // Create a card
      const card = CardFactory.create({
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.NOTE,
          text: 'Card for null published record test',
        },
      }).unwrap();

      await cardRepository.save(card);

      // Create collection without published record
      const collection = Collection.create(
        {
          authorId: curatorId,
          name: 'Collection Without Published Record',
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        new UniqueEntityID(),
      ).unwrap();

      collection.addCard(card.cardId, curatorId);
      await collectionRepository.save(collection);

      // Execute the query
      const result = await queryRepository.getCollectionsContainingCardForUser(
        card.cardId.getStringValue(),
        curatorId.value,
      );

      // Verify the result
      expect(result).toHaveLength(1);
      expect(result[0]?.uri).toBeUndefined();
      expect(result[0]?.name).toBe('Collection Without Published Record');
    });
  });

  describe('Multiple card types', () => {
    it('should work with different card types in the same collection', async () => {
      // Create different types of cards
      const urlCard = CardFactory.create({
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.URL,
          url: 'https://example.com/test',
        },
      }).unwrap();

      const noteCard = CardFactory.create({
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.NOTE,
          text: 'Test note',
        },
      }).unwrap();

      const highlightCard = CardFactory.create({
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.HIGHLIGHT,
          text: 'Test highlight',
          url: 'https://example.com/source',
        },
      }).unwrap();

      await cardRepository.save(urlCard);
      await cardRepository.save(noteCard);
      await cardRepository.save(highlightCard);

      // Create collection and add all cards
      const collection = Collection.create(
        {
          authorId: curatorId,
          name: 'Mixed Content Collection',
          description: 'Collection with different card types',
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        new UniqueEntityID(),
      ).unwrap();

      collection.addCard(urlCard.cardId, curatorId);
      collection.addCard(noteCard.cardId, curatorId);
      collection.addCard(highlightCard.cardId, curatorId);

      await collectionRepository.save(collection);

      // Test each card type
      const urlResult = await queryRepository.getCollectionsContainingCardForUser(
        urlCard.cardId.getStringValue(),
        curatorId.value,
      );

      const noteResult = await queryRepository.getCollectionsContainingCardForUser(
        noteCard.cardId.getStringValue(),
        curatorId.value,
      );

      const highlightResult = await queryRepository.getCollectionsContainingCardForUser(
        highlightCard.cardId.getStringValue(),
        curatorId.value,
      );

      // Verify all return the same collection
      expect(urlResult).toHaveLength(1);
      expect(noteResult).toHaveLength(1);
      expect(highlightResult).toHaveLength(1);

      expect(urlResult[0]?.name).toBe('Mixed Content Collection');
      expect(noteResult[0]?.name).toBe('Mixed Content Collection');
      expect(highlightResult[0]?.name).toBe('Mixed Content Collection');

      expect(urlResult[0]?.id).toBe(collection.collectionId.getStringValue());
      expect(noteResult[0]?.id).toBe(collection.collectionId.getStringValue());
      expect(highlightResult[0]?.id).toBe(collection.collectionId.getStringValue());
    });
  });
});
