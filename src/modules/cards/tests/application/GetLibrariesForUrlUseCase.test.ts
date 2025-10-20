import { GetLibrariesForUrlUseCase } from '../../application/useCases/queries/GetLibrariesForUrlUseCase';
import { InMemoryCardRepository } from '../utils/InMemoryCardRepository';
import { InMemoryCardQueryRepository } from '../utils/InMemoryCardQueryRepository';
import { InMemoryCollectionRepository } from '../utils/InMemoryCollectionRepository';
import { CuratorId } from '../../domain/value-objects/CuratorId';
import { CardBuilder } from '../utils/builders/CardBuilder';
import { CardTypeEnum } from '../../domain/value-objects/CardType';
import { URL } from '../../domain/value-objects/URL';
import { CardSortField, SortOrder } from '../../domain/ICardQueryRepository';
import { IProfileService } from '../../domain/services/IProfileService';
import { ok } from 'src/shared/core/Result';

describe('GetLibrariesForUrlUseCase', () => {
  let useCase: GetLibrariesForUrlUseCase;
  let cardRepository: InMemoryCardRepository;
  let cardQueryRepository: InMemoryCardQueryRepository;
  let collectionRepository: InMemoryCollectionRepository;
  let mockProfileService: IProfileService;
  let curator1: CuratorId;
  let curator2: CuratorId;
  let curator3: CuratorId;

  beforeEach(() => {
    cardRepository = new InMemoryCardRepository();
    collectionRepository = new InMemoryCollectionRepository();
    cardQueryRepository = new InMemoryCardQueryRepository(
      cardRepository,
      collectionRepository,
    );

    // Create mock profile service
    mockProfileService = {
      getProfile: jest.fn((userId: string) => {
        return Promise.resolve(
          ok({
            id: userId,
            name: `User ${userId.slice(-8)}`,
            handle: `handle.${userId.slice(-8)}`,
            avatarUrl: `https://avatar.example.com/${userId}`,
            bio: `Bio for ${userId}`,
          }),
        );
      }),
      enrichProfile: jest.fn(),
    };

    useCase = new GetLibrariesForUrlUseCase(
      cardQueryRepository,
      mockProfileService,
    );

    curator1 = CuratorId.create('did:plc:curator1').unwrap();
    curator2 = CuratorId.create('did:plc:curator2').unwrap();
    curator3 = CuratorId.create('did:plc:curator3').unwrap();
  });

  afterEach(() => {
    cardRepository.clear();
    collectionRepository.clear();
    cardQueryRepository.clear();
  });

  describe('Multiple users with same URL', () => {
    it('should return all users who have cards with the specified URL', async () => {
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

      // Save cards
      await cardRepository.save(card1);
      await cardRepository.save(card2);
      await cardRepository.save(card3);

      // Execute the use case
      const query = {
        url: testUrl,
      };

      const result = await useCase.execute(query);

      // Verify the result
      expect(result.isOk()).toBe(true);
      const response = result.unwrap();

      expect(response.libraries).toHaveLength(3);
      expect(response.pagination.totalCount).toBe(3);

      // Check that all three users are included (now with enriched profile data)
      const userIds = response.libraries.map((lib) => lib.id);
      expect(userIds).toContain(curator1.value);
      expect(userIds).toContain(curator2.value);
      expect(userIds).toContain(curator3.value);

      // Verify enriched profile data is present
      response.libraries.forEach((lib) => {
        expect(lib.id).toBeDefined();
        expect(lib.name).toBeDefined();
        expect(lib.handle).toBeDefined();
      });
    });

    it('should return empty result when no users have cards with the specified URL', async () => {
      const testUrl = 'https://example.com/nonexistent-article';

      const query = {
        url: testUrl,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();

      expect(response.libraries).toHaveLength(0);
      expect(response.pagination.totalCount).toBe(0);
    });

    it('should not return users who have different URLs', async () => {
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

      // Query for testUrl1
      const query = {
        url: testUrl1,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();

      expect(response.libraries).toHaveLength(1);
      expect(response.libraries[0]!.id).toBe(curator1.value);
    });
  });

  describe('Pagination', () => {
    it('should paginate results correctly', async () => {
      const testUrl = 'https://example.com/popular-article';
      const url = URL.create(testUrl).unwrap();

      // Create 5 cards with the same URL from different users
      const cards = [];
      const curators = [];
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

      expect(response1.libraries).toHaveLength(2);
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

      expect(response2.libraries).toHaveLength(2);
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

      expect(response3.libraries).toHaveLength(1);
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
  });

  describe('Sorting', () => {
    it('should use default sorting parameters', async () => {
      const testUrl = 'https://example.com/test-article';

      const query = {
        url: testUrl,
      };

      const result = await useCase.execute(query);
      expect(result.isOk()).toBe(true);
      const response = result.unwrap();

      expect(response.sorting.sortBy).toBe(CardSortField.UPDATED_AT);
      expect(response.sorting.sortOrder).toBe(SortOrder.DESC);
    });

    it('should use provided sorting parameters', async () => {
      const testUrl = 'https://example.com/test-article';

      const query = {
        url: testUrl,
        sortBy: CardSortField.CREATED_AT,
        sortOrder: SortOrder.ASC,
      };

      const result = await useCase.execute(query);
      expect(result.isOk()).toBe(true);
      const response = result.unwrap();

      expect(response.sorting.sortBy).toBe(CardSortField.CREATED_AT);
      expect(response.sorting.sortOrder).toBe(SortOrder.ASC);
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
      const errorCardQueryRepository = {
        getUrlCardsOfUser: jest.fn(),
        getCardsInCollection: jest.fn(),
        getUrlCardView: jest.fn(),
        getLibrariesForCard: jest.fn(),
        getLibrariesForUrl: jest
          .fn()
          .mockRejectedValue(new Error('Database error')),
        getNoteCardsForUrl: jest.fn(),
      };

      const errorUseCase = new GetLibrariesForUrlUseCase(
        errorCardQueryRepository,
        mockProfileService,
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
