import { GetCollectionsForUrlUseCase } from '../../application/useCases/queries/GetCollectionsForUrlUseCase';
import { InMemoryCardRepository } from '../utils/InMemoryCardRepository';
import { InMemoryCollectionRepository } from '../utils/InMemoryCollectionRepository';
import { InMemoryCollectionQueryRepository } from '../utils/InMemoryCollectionQueryRepository';
import { CuratorId } from '../../domain/value-objects/CuratorId';
import { CardBuilder } from '../utils/builders/CardBuilder';
import { CollectionBuilder } from '../utils/builders/CollectionBuilder';
import { CardTypeEnum } from '../../domain/value-objects/CardType';
import { URL } from '../../domain/value-objects/URL';
import { PublishedRecordId } from '../../domain/value-objects/PublishedRecordId';

describe('GetCollectionsForUrlUseCase', () => {
  let useCase: GetCollectionsForUrlUseCase;
  let cardRepository: InMemoryCardRepository;
  let collectionRepository: InMemoryCollectionRepository;
  let collectionQueryRepository: InMemoryCollectionQueryRepository;
  let curator1: CuratorId;
  let curator2: CuratorId;
  let curator3: CuratorId;

  beforeEach(() => {
    cardRepository = new InMemoryCardRepository();
    collectionRepository = new InMemoryCollectionRepository();
    collectionQueryRepository = new InMemoryCollectionQueryRepository(
      collectionRepository,
      cardRepository,
    );

    useCase = new GetCollectionsForUrlUseCase(collectionQueryRepository);

    curator1 = CuratorId.create('did:plc:curator1').unwrap();
    curator2 = CuratorId.create('did:plc:curator2').unwrap();
    curator3 = CuratorId.create('did:plc:curator3').unwrap();
  });

  afterEach(() => {
    cardRepository.clear();
    collectionRepository.clear();
    collectionQueryRepository.clear();
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
        .build();

      const card2 = new CardBuilder()
        .withCuratorId(curator2.value)
        .withType(CardTypeEnum.URL)
        .withUrl(url)
        .build();

      const card3 = new CardBuilder()
        .withCuratorId(curator3.value)
        .withType(CardTypeEnum.URL)
        .withUrl(url)
        .build();

      if (
        card1 instanceof Error ||
        card2 instanceof Error ||
        card3 instanceof Error
      ) {
        throw new Error('Failed to create cards');
      }

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
        .build();

      const collection2 = new CollectionBuilder()
        .withAuthorId(curator2.value)
        .withName('Reading List')
        .withDescription('Articles to read')
        .build();

      const collection3 = new CollectionBuilder()
        .withAuthorId(curator3.value)
        .withName('Favorites')
        .build();

      if (
        collection1 instanceof Error ||
        collection2 instanceof Error ||
        collection3 instanceof Error
      ) {
        throw new Error('Failed to create collections');
      }

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

      // Execute the use case
      const query = {
        url: testUrl,
      };

      const result = await useCase.execute(query);

      // Verify the result
      expect(result.isOk()).toBe(true);
      const response = result.unwrap();

      expect(response.collections).toHaveLength(3);
      expect(response.pagination.totalCount).toBe(3);

      // Check that all three collections are included
      const collectionIds = response.collections.map((c) => c.id);
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
      const techArticles = response.collections.find(
        (c) => c.name === 'Tech Articles',
      );
      expect(techArticles).toBeDefined();
      expect(techArticles?.description).toBe('My tech articles');
      expect(techArticles?.authorId).toBe(curator1.value);
      expect(techArticles?.uri).toBe(
        'at://did:plc:curator1/network.cosmik.collection/collection1',
      );

      const readingList = response.collections.find(
        (c) => c.name === 'Reading List',
      );
      expect(readingList).toBeDefined();
      expect(readingList?.description).toBe('Articles to read');
      expect(readingList?.authorId).toBe(curator2.value);

      const favorites = response.collections.find(
        (c) => c.name === 'Favorites',
      );
      expect(favorites).toBeDefined();
      expect(favorites?.description).toBeUndefined();
      expect(favorites?.authorId).toBe(curator3.value);
    });

    it('should return empty array when no collections contain cards with the specified URL', async () => {
      const testUrl = 'https://example.com/nonexistent-article';

      const query = {
        url: testUrl,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();

      expect(response.collections).toHaveLength(0);
      expect(response.pagination.totalCount).toBe(0);
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
        .build();

      const card2 = new CardBuilder()
        .withCuratorId(curator2.value)
        .withType(CardTypeEnum.URL)
        .withUrl(url2)
        .build();

      if (card1 instanceof Error || card2 instanceof Error) {
        throw new Error('Failed to create cards');
      }

      card1.addToLibrary(curator1);
      card2.addToLibrary(curator2);

      await cardRepository.save(card1);
      await cardRepository.save(card2);

      // Create collections
      const collection1 = new CollectionBuilder()
        .withAuthorId(curator1.value)
        .withName('Collection 1')
        .build();

      const collection2 = new CollectionBuilder()
        .withAuthorId(curator2.value)
        .withName('Collection 2')
        .build();

      if (collection1 instanceof Error || collection2 instanceof Error) {
        throw new Error('Failed to create collections');
      }

      collection1.addCard(card1.cardId, curator1);
      collection2.addCard(card2.cardId, curator2);

      await collectionRepository.save(collection1);
      await collectionRepository.save(collection2);

      // Query for testUrl1
      const query = {
        url: testUrl1,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();

      expect(response.collections).toHaveLength(1);
      expect(response.collections[0]!.name).toBe('Collection 1');
      expect(response.collections[0]!.authorId).toBe(curator1.value);
    });

    it('should return multiple collections from the same user if they contain the URL', async () => {
      const testUrl = 'https://example.com/popular-article';
      const url = URL.create(testUrl).unwrap();

      // Create URL card
      const card = new CardBuilder()
        .withCuratorId(curator1.value)
        .withType(CardTypeEnum.URL)
        .withUrl(url)
        .build();

      if (card instanceof Error) {
        throw new Error('Failed to create card');
      }

      card.addToLibrary(curator1);
      await cardRepository.save(card);

      // Create multiple collections for the same user
      const collection1 = new CollectionBuilder()
        .withAuthorId(curator1.value)
        .withName('Tech')
        .build();

      const collection2 = new CollectionBuilder()
        .withAuthorId(curator1.value)
        .withName('Favorites')
        .build();

      const collection3 = new CollectionBuilder()
        .withAuthorId(curator1.value)
        .withName('To Read')
        .build();

      if (
        collection1 instanceof Error ||
        collection2 instanceof Error ||
        collection3 instanceof Error
      ) {
        throw new Error('Failed to create collections');
      }

      // Add the same card to all collections
      collection1.addCard(card.cardId, curator1);
      collection2.addCard(card.cardId, curator1);
      collection3.addCard(card.cardId, curator1);

      await collectionRepository.save(collection1);
      await collectionRepository.save(collection2);
      await collectionRepository.save(collection3);

      // Execute the use case
      const query = {
        url: testUrl,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();

      expect(response.collections).toHaveLength(3);

      const collectionNames = response.collections.map((c) => c.name);
      expect(collectionNames).toContain('Tech');
      expect(collectionNames).toContain('Favorites');
      expect(collectionNames).toContain('To Read');

      // All should have the same author
      response.collections.forEach((collection) => {
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
        .build();

      if (card instanceof Error) {
        throw new Error('Failed to create card');
      }

      card.addToLibrary(curator1);
      await cardRepository.save(card);

      // Create collection without publishing it
      const collection = new CollectionBuilder()
        .withAuthorId(curator1.value)
        .withName('Unpublished Collection')
        .build();

      if (collection instanceof Error) {
        throw new Error('Failed to create collection');
      }

      collection.addCard(card.cardId, curator1);
      await collectionRepository.save(collection);

      // Execute the use case
      const query = {
        url: testUrl,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();

      expect(response.collections).toHaveLength(1);
      expect(response.collections[0]!.name).toBe('Unpublished Collection');
      expect(response.collections[0]!.uri).toBeUndefined();
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
          .build();

        if (card instanceof Error) {
          throw new Error(`Failed to create card ${i}`);
        }

        card.addToLibrary(curator);
        cards.push(card);
        await cardRepository.save(card);

        // Create collection for each user
        const collection = new CollectionBuilder()
          .withAuthorId(curator.value)
          .withName(`Collection ${i}`)
          .build();

        if (collection instanceof Error) {
          throw new Error(`Failed to create collection ${i}`);
        }

        collection.addCard(card.cardId, curator);
        collections.push(collection);
        await collectionRepository.save(collection);
      }

      // Test first page with limit 2
      const query1 = {
        url: testUrl,
        page: 1,
        limit: 2,
      };

      const result1 = await useCase.execute(query1);
      expect(result1.isOk()).toBe(true);
      const response1 = result1.unwrap();

      expect(response1.collections).toHaveLength(2);
      expect(response1.pagination.currentPage).toBe(1);
      expect(response1.pagination.totalCount).toBe(5);
      expect(response1.pagination.totalPages).toBe(3);
      expect(response1.pagination.hasMore).toBe(true);

      // Test second page
      const query2 = {
        url: testUrl,
        page: 2,
        limit: 2,
      };

      const result2 = await useCase.execute(query2);
      expect(result2.isOk()).toBe(true);
      const response2 = result2.unwrap();

      expect(response2.collections).toHaveLength(2);
      expect(response2.pagination.currentPage).toBe(2);
      expect(response2.pagination.hasMore).toBe(true);

      // Test last page
      const query3 = {
        url: testUrl,
        page: 3,
        limit: 2,
      };

      const result3 = await useCase.execute(query3);
      expect(result3.isOk()).toBe(true);
      const response3 = result3.unwrap();

      expect(response3.collections).toHaveLength(1);
      expect(response3.pagination.currentPage).toBe(3);
      expect(response3.pagination.hasMore).toBe(false);
    });

    it('should respect limit cap of 100', async () => {
      const query = {
        url: 'https://example.com/test',
        limit: 200, // Should be capped at 100
      };

      const result = await useCase.execute(query);
      expect(result.isOk()).toBe(true);
      const response = result.unwrap();

      expect(response.pagination.limit).toBe(100);
    });

    it('should use default pagination values', async () => {
      const testUrl = 'https://example.com/test-article';

      const query = {
        url: testUrl,
      };

      const result = await useCase.execute(query);
      expect(result.isOk()).toBe(true);
      const response = result.unwrap();

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.limit).toBe(20);
    });
  });

  describe('Validation', () => {
    it('should fail with invalid URL', async () => {
      const query = {
        url: 'not-a-valid-url',
      };

      const result = await useCase.execute(query);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Invalid URL');
      }
    });
  });

  describe('Error handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Create a mock repository that throws an error
      const errorCollectionQueryRepository = {
        findByCreator: jest.fn(),
        getCollectionsContainingCardForUser: jest.fn(),
        getCollectionsWithUrl: jest
          .fn()
          .mockRejectedValue(new Error('Database error')),
      };

      const errorUseCase = new GetCollectionsForUrlUseCase(
        errorCollectionQueryRepository,
      );

      const query = {
        url: 'https://example.com/test-url',
      };

      const result = await errorUseCase.execute(query);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Database error');
      }
    });
  });
});
