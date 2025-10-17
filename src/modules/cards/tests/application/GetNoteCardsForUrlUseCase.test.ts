import { GetNoteCardsForUrlUseCase } from '../../application/useCases/queries/GetNoteCardsForUrlUseCase';
import { InMemoryCardRepository } from '../utils/InMemoryCardRepository';
import { InMemoryCardQueryRepository } from '../utils/InMemoryCardQueryRepository';
import { InMemoryCollectionRepository } from '../utils/InMemoryCollectionRepository';
import { CuratorId } from '../../domain/value-objects/CuratorId';
import { CardBuilder } from '../utils/builders/CardBuilder';
import { URL } from '../../domain/value-objects/URL';
import { CardSortField, SortOrder } from '../../domain/ICardQueryRepository';
import { FakeProfileService } from '../utils/FakeProfileService';

describe('GetNoteCardsForUrlUseCase', () => {
  let useCase: GetNoteCardsForUrlUseCase;
  let cardRepository: InMemoryCardRepository;
  let cardQueryRepository: InMemoryCardQueryRepository;
  let collectionRepository: InMemoryCollectionRepository;
  let profileService: FakeProfileService;
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
    profileService = new FakeProfileService();

    useCase = new GetNoteCardsForUrlUseCase(cardQueryRepository, profileService);

    curator1 = CuratorId.create('did:plc:curator1').unwrap();
    curator2 = CuratorId.create('did:plc:curator2').unwrap();
    curator3 = CuratorId.create('did:plc:curator3').unwrap();

    // Add profiles for test curators
    profileService.addProfile({
      id: curator1.value,
      name: 'Curator One',
      handle: 'curator1',
      avatarUrl: 'https://example.com/avatar1.jpg',
    });

    profileService.addProfile({
      id: curator2.value,
      name: 'Curator Two',
      handle: 'curator2',
      avatarUrl: 'https://example.com/avatar2.jpg',
    });

    profileService.addProfile({
      id: curator3.value,
      name: 'Curator Three',
      handle: 'curator3',
      avatarUrl: 'https://example.com/avatar3.jpg',
    });
  });

  afterEach(() => {
    cardRepository.clear();
    collectionRepository.clear();
    cardQueryRepository.clear();
    profileService.clear();
  });

  describe('Multiple users with notes for same URL', () => {
    it('should return all note cards for the specified URL', async () => {
      const testUrl = 'https://example.com/shared-article';
      const url = URL.create(testUrl).unwrap();

      // Create note cards for different users with the same URL
      const noteCard1 = new CardBuilder()
        .withCuratorId(curator1.value)
        .withNoteCard('First user note about the article')
        .withUrl(url)
        .buildOrThrow();

      const noteCard2 = new CardBuilder()
        .withCuratorId(curator2.value)
        .withNoteCard('Second user note about the article')
        .withUrl(url)
        .buildOrThrow();

      const noteCard3 = new CardBuilder()
        .withCuratorId(curator3.value)
        .withNoteCard('Third user note about the article')
        .withUrl(url)
        .buildOrThrow();

      // Save note cards
      await cardRepository.save(noteCard1);
      await cardRepository.save(noteCard2);
      await cardRepository.save(noteCard3);

      // Execute the use case
      const query = {
        url: testUrl,
      };

      const result = await useCase.execute(query);

      // Verify the result
      expect(result.isOk()).toBe(true);
      const response = result.unwrap();

      expect(response.notes).toHaveLength(3);
      expect(response.pagination.totalCount).toBe(3);

      // Check that all three users' notes are included
      const authorIds = response.notes.map((note) => note.author.id);
      expect(authorIds).toContain(curator1.value);
      expect(authorIds).toContain(curator2.value);
      expect(authorIds).toContain(curator3.value);

      // Check note content
      const noteTexts = response.notes.map((note) => note.note);
      expect(noteTexts).toContain('First user note about the article');
      expect(noteTexts).toContain('Second user note about the article');
      expect(noteTexts).toContain('Third user note about the article');
    });

    it('should return empty result when no notes exist for the URL', async () => {
      const testUrl = 'https://example.com/nonex istent-article';

      const query = {
        url: testUrl,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();

      expect(response.notes).toHaveLength(0);
      expect(response.pagination.totalCount).toBe(0);
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
      const query = {
        url: testUrl1,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();

      expect(response.notes).toHaveLength(1);
      expect(response.notes[0]!.note).toBe('Note for article 1');
      expect(response.notes[0]!.author.id).toBe(curator1.value);
    });
  });

  describe('Pagination', () => {
    it('should paginate results correctly', async () => {
      const testUrl = 'https://example.com/popular-article';
      const url = URL.create(testUrl).unwrap();

      // Create 5 note cards with the same URL from different users
      for (let i = 1; i <= 5; i++) {
        const curator = CuratorId.create(`did:plc:curator${i}`).unwrap();

        // Add profile for this curator
        profileService.addProfile({
          id: curator.value,
          name: `Curator ${i}`,
          handle: `curator${i}`,
          avatarUrl: `https://example.com/avatar${i}.jpg`,
        });

        const noteCard = new CardBuilder()
          .withCuratorId(curator.value)
          .withNoteCard(`Note ${i} about the article`)
          .withUrl(url)
          .buildOrThrow();

        await cardRepository.save(noteCard);
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

      expect(response1.notes).toHaveLength(2);
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

      expect(response2.notes).toHaveLength(2);
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

      expect(response3.notes).toHaveLength(1);
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
});
