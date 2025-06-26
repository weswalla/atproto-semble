import { AddUrlToLibraryUseCase } from "../../application/useCases/commands/AddUrlToLibraryUseCase";
import { InMemoryCardRepository } from "../utils/InMemoryCardRepository";
import { InMemoryCollectionRepository } from "../utils/InMemoryCollectionRepository";
import { FakeCardPublisher } from "../utils/FakeCardPublisher";
import { FakeCollectionPublisher } from "../utils/FakeCollectionPublisher";
import { FakeMetadataService } from "../utils/FakeMetadataService";
import { CardLibraryService } from "../../domain/services/CardLibraryService";
import { CardCollectionService } from "../../domain/services/CardCollectionService";
import { CuratorId } from "../../../annotations/domain/value-objects/CuratorId";
import { CollectionBuilder } from "../utils/builders/CollectionBuilder";
import { CardTypeEnum } from "../../domain/value-objects/CardType";

describe("AddUrlToLibraryUseCase", () => {
  let useCase: AddUrlToLibraryUseCase;
  let cardRepository: InMemoryCardRepository;
  let collectionRepository: InMemoryCollectionRepository;
  let cardPublisher: FakeCardPublisher;
  let collectionPublisher: FakeCollectionPublisher;
  let metadataService: FakeMetadataService;
  let cardLibraryService: CardLibraryService;
  let cardCollectionService: CardCollectionService;
  let curatorId: CuratorId;

  beforeEach(() => {
    cardRepository = new InMemoryCardRepository();
    collectionRepository = new InMemoryCollectionRepository();
    cardPublisher = new FakeCardPublisher();
    collectionPublisher = new FakeCollectionPublisher();
    metadataService = new FakeMetadataService();

    cardLibraryService = new CardLibraryService(cardRepository, cardPublisher);
    cardCollectionService = new CardCollectionService(
      collectionRepository,
      collectionPublisher
    );

    useCase = new AddUrlToLibraryUseCase(
      cardRepository,
      metadataService,
      cardLibraryService,
      cardCollectionService
    );

    curatorId = CuratorId.create("did:plc:testcurator").unwrap();
  });

  afterEach(() => {
    cardRepository.clear();
    collectionRepository.clear();
    cardPublisher.clear();
    collectionPublisher.clear();
    metadataService.clear();
  });

  describe("Basic URL card creation", () => {
    it("should create and add a URL card to library", async () => {
      const request = {
        url: "https://example.com/article",
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.urlCardId).toBeDefined();
      expect(response.noteCardId).toBeUndefined();

      // Verify card was saved
      const savedCards = cardRepository.getAllCards();
      expect(savedCards).toHaveLength(1);
      expect(savedCards[0]!.content.type).toBe(CardTypeEnum.URL);

      // Verify card was published to library
      const publishedCards = cardPublisher.getPublishedCards();
      expect(publishedCards).toHaveLength(1);
    });

    it("should create URL card with note when note is provided", async () => {
      const request = {
        url: "https://example.com/article",
        note: "This is a great article about testing",
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.urlCardId).toBeDefined();
      expect(response.noteCardId).toBeDefined();

      // Verify both cards were saved
      const savedCards = cardRepository.getAllCards();
      expect(savedCards).toHaveLength(2);

      const urlCard = savedCards.find(
        (card) => card.content.type === CardTypeEnum.URL
      );
      const noteCard = savedCards.find(
        (card) => card.content.type === CardTypeEnum.NOTE
      );

      expect(urlCard).toBeDefined();
      expect(noteCard).toBeDefined();
      expect(noteCard?.parentCardId?.getStringValue()).toBe(
        urlCard?.cardId.getStringValue()
      );

      // Verify both cards were published to library
      const publishedCards = cardPublisher.getPublishedCards();
      expect(publishedCards).toHaveLength(2);
    });
  });

  describe("Existing URL card handling", () => {
    it("should reuse existing URL card instead of creating new one", async () => {
      const url = "https://example.com/existing";

      // First request creates the URL card
      const firstRequest = {
        url,
        curatorId: curatorId.value,
      };

      const firstResult = await useCase.execute(firstRequest);
      expect(firstResult.isOk()).toBe(true);
      const firstResponse = firstResult.unwrap();

      // Second request should reuse the same URL card
      const secondRequest = {
        url,
        note: "Adding a note to existing URL",
        curatorId: curatorId.value,
      };

      const secondResult = await useCase.execute(secondRequest);
      expect(secondResult.isOk()).toBe(true);
      const secondResponse = secondResult.unwrap();

      // Should have same URL card ID
      expect(secondResponse.urlCardId).toBe(firstResponse.urlCardId);
      expect(secondResponse.noteCardId).toBeDefined();

      // Should have URL card + note card
      const savedCards = cardRepository.getAllCards();
      expect(savedCards).toHaveLength(2);

      const urlCards = savedCards.filter(
        (card) => card.content.type === CardTypeEnum.URL
      );
      expect(urlCards).toHaveLength(1); // Only one URL card
    });
  });

  describe("Collection handling", () => {
    it("should add URL card to specified collections", async () => {
      // Create a test collection
      const collection = new CollectionBuilder()
        .withAuthorId(curatorId.value)
        .withName("Test Collection")
        .build();

      if (collection instanceof Error) {
        throw new Error(`Failed to create collection: ${collection.message}`);
      }

      await collectionRepository.save(collection);

      const request = {
        url: "https://example.com/article",
        collectionIds: [collection.collectionId.getStringValue()],
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);

      // Verify collection link was published
      const publishedLinks = collectionPublisher.getPublishedLinksForCollection(
        collection.collectionId.getStringValue()
      );
      expect(publishedLinks).toHaveLength(1);
    });

    it("should fail when collection does not exist", async () => {
      const request = {
        url: "https://example.com/article",
        collectionIds: ["non-existent-collection-id"],
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain("Collection not found");
    });
  });

  describe("Validation", () => {
    it("should fail with invalid URL", async () => {
      const request = {
        url: "not-a-valid-url",
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain("Invalid URL");
    });

    it("should fail with invalid curator ID", async () => {
      const request = {
        url: "https://example.com/article",
        curatorId: "invalid-curator-id",
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain("Invalid curator ID");
    });

    it("should fail with invalid collection ID", async () => {
      const request = {
        url: "https://example.com/article",
        collectionIds: ["invalid-collection-id"],
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain("Collection not found");
    });
  });

  describe("Metadata service integration", () => {
    it("should handle metadata service failure gracefully", async () => {
      // Configure metadata service to fail
      metadataService.setShouldFail(true);

      const request = {
        url: "https://example.com/article",
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain("Failed to fetch metadata");
    });
  });
});
