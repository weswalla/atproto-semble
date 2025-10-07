import { RemoveCardFromLibraryUseCase } from '../../application/useCases/commands/RemoveCardFromLibraryUseCase';
import { InMemoryCardRepository } from '../utils/InMemoryCardRepository';
import { FakeCardPublisher } from '../utils/FakeCardPublisher';
import { CardLibraryService } from '../../domain/services/CardLibraryService';
import { CuratorId } from '../../domain/value-objects/CuratorId';
import { CardBuilder } from '../utils/builders/CardBuilder';
import { CardTypeEnum } from '../../domain/value-objects/CardType';
import { InMemoryCollectionRepository } from '../utils/InMemoryCollectionRepository';
import { FakeCollectionPublisher } from '../utils/FakeCollectionPublisher';
import { CardCollectionService } from '../../domain/services/CardCollectionService';
import { CollectionBuilder } from '../utils/builders/CollectionBuilder';

describe('RemoveCardFromLibraryUseCase', () => {
  let useCase: RemoveCardFromLibraryUseCase;
  let cardRepository: InMemoryCardRepository;
  let collectionRepository: InMemoryCollectionRepository;
  let cardPublisher: FakeCardPublisher;
  let collectionPublisher: FakeCollectionPublisher;
  let cardCollectionService: CardCollectionService;
  let cardLibraryService: CardLibraryService;
  let curatorId: CuratorId;
  let otherCuratorId: CuratorId;

  beforeEach(() => {
    cardRepository = new InMemoryCardRepository();
    cardPublisher = new FakeCardPublisher();
    collectionRepository = new InMemoryCollectionRepository();
    collectionPublisher = new FakeCollectionPublisher();
    cardCollectionService = new CardCollectionService(
      collectionRepository,
      collectionPublisher,
    );
    cardLibraryService = new CardLibraryService(
      cardRepository,
      cardPublisher,
      collectionRepository,
      cardCollectionService,
    );

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

  const createCollection = async (
    curatorId: CuratorId,
    name: string = 'Test Collection',
  ) => {
    const collection = new CollectionBuilder()
      .withAuthorId(curatorId.value)
      .withName(name)
      .build();

    if (collection instanceof Error) {
      throw new Error(`Failed to create collection: ${collection.message}`);
    }

    await collectionRepository.save(collection);
    return collection;
  };

  const addCardToCollection = async (
    card: any,
    collection: any,
    curatorId: CuratorId,
  ) => {
    const addResult = await cardCollectionService.addCardToCollection(
      card,
      collection.collectionId,
      curatorId,
    );
    if (addResult.isErr()) {
      throw new Error(
        `Failed to add card to collection: ${addResult.error.message}`,
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

    it("should remove URL card from creator's library", async () => {
      const card = await createCard();

      // Add card to creator's library only (URL cards can only be in creator's library)
      await addCardToLibrary(card, curatorId);

      const request = {
        cardId: card.cardId.getStringValue(),
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);

      // Verify card was removed from creator's library
      const updatedCardResult = await cardRepository.findById(card.cardId);
      const updatedCard = updatedCardResult.unwrap()!;
      expect(updatedCard.isInLibrary(curatorId)).toBe(false);

      // Verify unpublish operation occurred
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

  describe('Collection integration', () => {
    it('should remove card from all curator collections when removed from library', async () => {
      const card = await createCard();
      await addCardToLibrary(card, curatorId);

      // Create multiple collections for the curator
      const collection1 = await createCollection(curatorId, 'Collection 1');
      const collection2 = await createCollection(curatorId, 'Collection 2');
      const collection3 = await createCollection(curatorId, 'Collection 3');

      // Add card to all collections
      await addCardToCollection(card, collection1, curatorId);
      await addCardToCollection(card, collection2, curatorId);
      await addCardToCollection(card, collection3, curatorId);

      // Verify card is in all collections
      const initialCollection1Result = await collectionRepository.findById(
        collection1.collectionId,
      );
      const initialCollection2Result = await collectionRepository.findById(
        collection2.collectionId,
      );
      const initialCollection3Result = await collectionRepository.findById(
        collection3.collectionId,
      );

      expect(
        initialCollection1Result
          .unwrap()!
          .cardIds.some((id) => id.equals(card.cardId)),
      ).toBe(true);
      expect(
        initialCollection2Result
          .unwrap()!
          .cardIds.some((id) => id.equals(card.cardId)),
      ).toBe(true);
      expect(
        initialCollection3Result
          .unwrap()!
          .cardIds.some((id) => id.equals(card.cardId)),
      ).toBe(true);

      // Remove card from library
      const request = {
        cardId: card.cardId.getStringValue(),
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);

      // Verify card was removed from library
      const updatedCardResult = await cardRepository.findById(card.cardId);
      const updatedCard = updatedCardResult.unwrap()!;
      expect(updatedCard.isInLibrary(curatorId)).toBe(false);

      // Verify card was removed from all collections
      const finalCollection1Result = await collectionRepository.findById(
        collection1.collectionId,
      );
      const finalCollection2Result = await collectionRepository.findById(
        collection2.collectionId,
      );
      const finalCollection3Result = await collectionRepository.findById(
        collection3.collectionId,
      );

      expect(
        finalCollection1Result
          .unwrap()!
          .cardIds.some((id) => id.equals(card.cardId)),
      ).toBe(false);
      expect(
        finalCollection2Result
          .unwrap()!
          .cardIds.some((id) => id.equals(card.cardId)),
      ).toBe(false);
      expect(
        finalCollection3Result
          .unwrap()!
          .cardIds.some((id) => id.equals(card.cardId)),
      ).toBe(false);

      const unpublishedCollectionLinks =
        collectionPublisher.getAllRemovedLinks();
      expect(unpublishedCollectionLinks).toHaveLength(3);
    });

    it('should remove URL card from creator collections only', async () => {
      const card = await createCard();
      await addCardToLibrary(card, curatorId);

      // Create collections for the creator only (URL cards can only be in creator's library)
      const curatorCollection = await createCollection(
        curatorId,
        'Curator Collection',
      );

      // Add card to creator's collection
      await addCardToCollection(card, curatorCollection, curatorId);

      // Remove card from creator's library
      const request = {
        cardId: card.cardId.getStringValue(),
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);

      // Verify card was removed from curator's collection
      const curatorCollectionResult = await collectionRepository.findById(
        curatorCollection.collectionId,
      );

      expect(
        curatorCollectionResult
          .unwrap()!
          .cardIds.some((id) => id.equals(card.cardId)),
      ).toBe(false);

      // Verify card was removed from creator's library
      const updatedCardResult = await cardRepository.findById(card.cardId);
      const updatedCard = updatedCardResult.unwrap()!;
      expect(updatedCard.isInLibrary(curatorId)).toBe(false);
    });

    it('should handle card removal when no collections contain the card', async () => {
      const card = await createCard();
      await addCardToLibrary(card, curatorId);

      // Create collections but don't add the card to them
      await createCollection(curatorId, 'Empty Collection 1');
      await createCollection(curatorId, 'Empty Collection 2');

      const request = {
        cardId: card.cardId.getStringValue(),
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);

      // Verify card was removed from library
      const updatedCardResult = await cardRepository.findById(card.cardId);
      const updatedCard = updatedCardResult.unwrap()!;
      expect(updatedCard.isInLibrary(curatorId)).toBe(false);

      // Verify no collection unpublish operations occurred
      const unpublishedCollections =
        collectionPublisher.getUnpublishedCollections();
      expect(unpublishedCollections).toHaveLength(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle URL card with single library membership', async () => {
      const card = await createCard();

      // Add to creator's library only (URL cards can only be in creator's library)
      await addCardToLibrary(card, curatorId);

      expect(card.libraryMembershipCount).toBe(1);

      const request = {
        cardId: card.cardId.getStringValue(),
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);

      // Verify card has no library memberships after removal
      const updatedCardResult = await cardRepository.findById(card.cardId);
      const updatedCard = updatedCardResult.unwrap()!;
      expect(updatedCard.libraryMembershipCount).toBe(0);
      expect(updatedCard.isInLibrary(curatorId)).toBe(false);
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
