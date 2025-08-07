import { RemoveCardFromLibraryUseCase } from '../../application/useCases/commands/RemoveCardFromLibraryUseCase';
import { InMemoryCardRepository } from '../utils/InMemoryCardRepository';
import { FakeCardPublisher } from '../utils/FakeCardPublisher';
import { CardLibraryService } from '../../domain/services/CardLibraryService';
import { CuratorId } from '../../domain/value-objects/CuratorId';
import { CardBuilder } from '../utils/builders/CardBuilder';
import { CardTypeEnum } from '../../domain/value-objects/CardType';

describe('RemoveCardFromLibraryUseCase', () => {
  let useCase: RemoveCardFromLibraryUseCase;
  let cardRepository: InMemoryCardRepository;
  let cardPublisher: FakeCardPublisher;
  let cardLibraryService: CardLibraryService;
  let curatorId: CuratorId;
  let otherCuratorId: CuratorId;

  beforeEach(() => {
    cardRepository = new InMemoryCardRepository();
    cardPublisher = new FakeCardPublisher();
    cardLibraryService = new CardLibraryService(cardRepository, cardPublisher);

    useCase = new RemoveCardFromLibraryUseCase(
      cardRepository,
      cardLibraryService,
    );

    curatorId = CuratorId.create('did:plc:testcurator').unwrap();
    otherCuratorId = CuratorId.create('did:plc:othercurator').unwrap();
  });

  afterEach(() => {
    cardRepository.clear();
    cardPublisher.clear();
  });

  const createCard = async (type: CardTypeEnum = CardTypeEnum.URL) => {
    const card = new CardBuilder().withType(type).build();

    if (card instanceof Error) {
      throw new Error(`Failed to create card: ${card.message}`);
    }

    await cardRepository.save(card);
    return card;
  };

  const addCardToLibrary = async (card: any, curatorId: CuratorId) => {
    const addResult = await cardLibraryService.addCardToLibrary(
      card,
      curatorId,
    );
    if (addResult.isErr()) {
      throw new Error(
        `Failed to add card to library: ${addResult.error.message}`,
      );
    }
  };

  describe('Basic card removal from library', () => {
    it('should successfully remove card from library', async () => {
      const card = await createCard();

      // Add card to library first
      await addCardToLibrary(card, curatorId);

      const request = {
        cardId: card.cardId.getStringValue(),
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.cardId).toBe(card.cardId.getStringValue());

      // Verify card was removed from library
      const updatedCardResult = await cardRepository.findById(card.cardId);
      const updatedCard = updatedCardResult.unwrap()!;
      expect(updatedCard.isInLibrary(curatorId)).toBe(false);

      // Verify unpublish operation occurred
      const unpublishedCards = cardPublisher.getUnpublishedCards();
      expect(unpublishedCards).toHaveLength(1);
    });

    it("should remove card from one user's library without affecting others", async () => {
      const card = await createCard();

      // Add card to both users' libraries
      await addCardToLibrary(card, curatorId);
      await addCardToLibrary(card, otherCuratorId);

      const request = {
        cardId: card.cardId.getStringValue(),
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);

      // Verify card was removed from curatorId's library but not otherCuratorId's
      const updatedCardResult = await cardRepository.findById(card.cardId);
      const updatedCard = updatedCardResult.unwrap()!;
      expect(updatedCard.isInLibrary(curatorId)).toBe(false);
      expect(updatedCard.isInLibrary(otherCuratorId)).toBe(true);

      // Verify only one unpublish operation occurred
      const unpublishedCards = cardPublisher.getUnpublishedCards();
      expect(unpublishedCards).toHaveLength(1);
    });

    it('should handle different card types', async () => {
      const urlCard = await createCard(CardTypeEnum.URL);
      const noteCard = await createCard(CardTypeEnum.NOTE);

      await addCardToLibrary(urlCard, curatorId);
      await addCardToLibrary(noteCard, curatorId);

      // Remove URL card
      const urlRequest = {
        cardId: urlCard.cardId.getStringValue(),
        curatorId: curatorId.value,
      };

      const urlResult = await useCase.execute(urlRequest);
      expect(urlResult.isOk()).toBe(true);

      // Remove note card
      const noteRequest = {
        cardId: noteCard.cardId.getStringValue(),
        curatorId: curatorId.value,
      };

      const noteResult = await useCase.execute(noteRequest);
      expect(noteResult.isOk()).toBe(true);

      // Verify both cards were removed
      const updatedUrlCardResult = await cardRepository.findById(
        urlCard.cardId,
      );
      const updatedNoteCardResult = await cardRepository.findById(
        noteCard.cardId,
      );

      const updatedUrlCard = updatedUrlCardResult.unwrap()!;
      const updatedNoteCard = updatedNoteCardResult.unwrap()!;

      expect(updatedUrlCard.isInLibrary(curatorId)).toBe(false);
      expect(updatedNoteCard.isInLibrary(curatorId)).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should fail with invalid card ID', async () => {
      const request = {
        cardId: 'invalid-card-id',
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Card not found');
      }
    });

    it('should fail with invalid curator ID', async () => {
      const card = await createCard();

      const request = {
        cardId: card.cardId.getStringValue(),
        curatorId: 'invalid-curator-id',
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Invalid curator ID');
      }
    });

    it('should fail when card does not exist', async () => {
      const request = {
        cardId: 'non-existent-card-id',
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Card not found');
      }
    });
  });

  describe('Publishing integration', () => {
    it('should unpublish card from library when removed', async () => {
      const card = await createCard();
      await addCardToLibrary(card, curatorId);

      const initialUnpublishCount = cardPublisher.getUnpublishedCards().length;

      const request = {
        cardId: card.cardId.getStringValue(),
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);

      // Verify unpublish operation occurred
      const finalUnpublishCount = cardPublisher.getUnpublishedCards().length;
      expect(finalUnpublishCount).toBe(initialUnpublishCount + 1);

      // Verify the correct card was unpublished
      const unpublishedCards = cardPublisher.getUnpublishedCards();
      const unpublishedCard = unpublishedCards.find(
        (uc) => uc.cardId === card.cardId.getStringValue(),
      );
      expect(unpublishedCard).toBeDefined();
    });

    it('should handle unpublish failure gracefully', async () => {
      const card = await createCard();
      await addCardToLibrary(card, curatorId);

      // Configure publisher to fail unpublish
      cardPublisher.setShouldFailUnpublish(true);

      const request = {
        cardId: card.cardId.getStringValue(),
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);

      // Verify card was not removed from library if unpublish failed
      const cardResult = await cardRepository.findById(card.cardId);
      const cardFromRepo = cardResult.unwrap()!;
      expect(cardFromRepo.isInLibrary(curatorId)).toBe(true);
    });

    it('should not unpublish if card was never published', async () => {
      const card = await createCard();

      // Manually add to library without publishing
      const addResult = card.addToLibrary(curatorId);
      expect(addResult.isOk()).toBe(true);
      await cardRepository.save(card);

      const initialUnpublishCount = cardPublisher.getUnpublishedCards().length;

      const request = {
        cardId: card.cardId.getStringValue(),
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);

      // Verify no unpublish operation occurred
      const finalUnpublishCount = cardPublisher.getUnpublishedCards().length;
      expect(finalUnpublishCount).toBe(initialUnpublishCount);

      // Verify card was still removed from library
      const updatedCardResult = await cardRepository.findById(card.cardId);
      const updatedCard = updatedCardResult.unwrap()!;
      expect(updatedCard.isInLibrary(curatorId)).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle card with multiple library memberships', async () => {
      const card = await createCard();

      // Add to multiple users' libraries
      await addCardToLibrary(card, curatorId);
      await addCardToLibrary(card, otherCuratorId);

      expect(card.libraryMembershipCount).toBe(2);

      const request = {
        cardId: card.cardId.getStringValue(),
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);

      // Verify card still has one library membership
      const updatedCardResult = await cardRepository.findById(card.cardId);
      const updatedCard = updatedCardResult.unwrap()!;
      expect(updatedCard.libraryMembershipCount).toBe(1);
      expect(updatedCard.isInLibrary(otherCuratorId)).toBe(true);
    });

    it('should handle repository save failure', async () => {
      const card = await createCard();
      await addCardToLibrary(card, curatorId);

      // Configure repository to fail save
      cardRepository.setShouldFailSave(true);

      const request = {
        cardId: card.cardId.getStringValue(),
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
    });

    it('should preserve card properties when removing from library', async () => {
      const card = await createCard();
      await addCardToLibrary(card, curatorId);

      const originalCreatedAt = card.createdAt;
      const originalType = card.type.value;
      const originalContent = card.content;

      const request = {
        cardId: card.cardId.getStringValue(),
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);

      // Verify card properties are preserved
      const updatedCardResult = await cardRepository.findById(card.cardId);
      const updatedCard = updatedCardResult.unwrap()!;

      expect(updatedCard.createdAt).toEqual(originalCreatedAt);
      expect(updatedCard.type.value).toBe(originalType);
      expect(updatedCard.content).toEqual(originalContent);
      expect(updatedCard.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalCreatedAt.getTime(),
      );
    });
  });
});
