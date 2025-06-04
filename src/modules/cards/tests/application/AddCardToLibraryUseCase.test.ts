import { AddCardToLibraryUseCase, ValidationError } from "../../application/AddCardToLibraryUseCase";
import { InMemoryCardRepository } from "../utils/InMemoryCardRepository";
import { InMemoryCollectionRepository } from "../utils/InMemoryCollectionRepository";
import { FakeMetadataService } from "../utils/FakeMetadataService";
import { Collection, CollectionAccessType } from "../../domain/Collection";
import { CardTypeEnum } from "../../domain/value-objects/CardType";
import { CuratorId } from "../../../annotations/domain/value-objects/CuratorId";
import { UrlMetadata } from "../../domain/value-objects/UrlMetadata";

describe("AddCardToLibraryUseCase", () => {
  let cardRepository: InMemoryCardRepository;
  let collectionRepository: InMemoryCollectionRepository;
  let metadataService: FakeMetadataService;
  let useCase: AddCardToLibraryUseCase;
  let curatorId: CuratorId;

  beforeEach(() => {
    cardRepository = new InMemoryCardRepository();
    collectionRepository = new InMemoryCollectionRepository();
    metadataService = new FakeMetadataService();
    useCase = new AddCardToLibraryUseCase(
      cardRepository,
      collectionRepository,
      metadataService
    );

    const curatorIdResult = CuratorId.create("did:plc:curator123");
    expect(curatorIdResult.isOk()).toBe(true);
    curatorId = curatorIdResult.value;
  });

  afterEach(() => {
    cardRepository.clear();
    collectionRepository.clear();
    metadataService.clear();
  });

  describe("URL Card Creation", () => {
    it("should create a URL card with fetched metadata", async () => {
      // Arrange
      const testUrl = "https://example.com/article";
      const expectedMetadata = UrlMetadata.create({
        url: testUrl,
        title: "Test Article",
        description: "A test article",
        author: "Test Author",
        siteName: "Test Site",
        retrievedAt: new Date(),
      }).unwrap();

      metadataService.setMetadata(testUrl, expectedMetadata);

      const dto = {
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.URL,
          url: testUrl,
        },
      };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const response = result.value;
        expect(response.cardId).toBeDefined();
        expect(response.addedToCollections).toEqual([]);
        expect(response.failedCollections).toEqual([]);

        // Verify card was saved
        const savedCards = cardRepository.getAllCards();
        expect(savedCards).toHaveLength(1);
        expect(savedCards[0]!.curatorId.value).toBe(curatorId.value);
        expect(savedCards[0]!.content.type).toBe("URL");
        
        const urlContent = savedCards[0]!.content.getUrlContent();
        expect(urlContent?.url.value).toBe(testUrl);
        expect(urlContent?.metadata?.title).toBe("Test Article");
      }
    });

    it("should fail when metadata service is unavailable", async () => {
      // Arrange
      metadataService.setAvailable(false);

      const dto = {
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.URL,
          url: "https://example.com/article",
        },
      };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("Failed to fetch metadata");
      }
    });

    it("should fail with invalid URL", async () => {
      // Arrange
      const dto = {
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.URL,
          url: "not-a-valid-url",
        },
      };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("Invalid URL");
      }
    });
  });

  describe("Note Card Creation", () => {
    it("should create a note card", async () => {
      // Arrange
      const dto = {
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.NOTE,
          text: "This is a test note",
          title: "Test Note",
        },
      };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const response = result.value;
        expect(response.cardId).toBeDefined();

        // Verify card was saved
        const savedCards = cardRepository.getAllCards();
        expect(savedCards).toHaveLength(1);
        expect(savedCards[0]!.content.type).toBe("NOTE");
        
        const noteContent = savedCards[0]!.content.getNoteContent();
        expect(noteContent?.text).toBe("This is a test note");
        expect(noteContent?.title).toBe("Test Note");
      }
    });
  });

  describe("Collection Management", () => {
    it("should add card to specified collections", async () => {
      // Arrange - Create a test collection
      const collectionResult = Collection.create({
        authorId: curatorId,
        name: "Test Collection",
        accessType: CollectionAccessType.OPEN,
        collaboratorIds: [],
        cardIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(collectionResult.isOk()).toBe(true);
      const collection = collectionResult.value;
      
      await collectionRepository.save(collection);

      const dto = {
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.NOTE,
          text: "Test note for collection",
        },
        collectionIds: [collection.collectionId.getStringValue()],
      };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const response = result.value;
        expect(response.addedToCollections).toEqual([collection.collectionId.getStringValue()]);
        expect(response.failedCollections).toEqual([]);

        // Verify collection was updated
        const updatedCollectionResult = await collectionRepository.findById(collection.collectionId);
        expect(updatedCollectionResult.isOk()).toBe(true);
        const updatedCollection = updatedCollectionResult.value;
        expect(updatedCollection?.cardIds).toHaveLength(1);
        expect(updatedCollection?.cardIds[0]?.getStringValue()).toBe(response.cardId);
      }
    });

    it("should handle non-existent collection gracefully", async () => {
      // Arrange
      const dto = {
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.NOTE,
          text: "Test note",
        },
        collectionIds: ["non-existent-collection-id"],
      };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const response = result.value;
        expect(response.cardId).toBeDefined();
        expect(response.addedToCollections).toEqual([]);
        expect(response.failedCollections).toHaveLength(1);
        expect(response.failedCollections[0]?.collectionId).toBe("non-existent-collection-id");
        expect(response.failedCollections[0]?.reason).toBe("Collection not found");

        // Verify card was still created
        const savedCards = cardRepository.getAllCards();
        expect(savedCards).toHaveLength(1);
      }
    });

    it("should handle invalid collection ID gracefully", async () => {
      // Arrange
      const dto = {
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.NOTE,
          text: "Test note",
        },
        collectionIds: [""], // Invalid empty collection ID
      };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const response = result.value;
        expect(response.failedCollections).toHaveLength(1);
        expect(response.failedCollections[0]?.reason).toContain("Invalid collection ID");
      }
    });
  });

  describe("Error Handling", () => {
    it("should fail with invalid curator ID", async () => {
      // Arrange
      const dto = {
        curatorId: "invalid-curator-id",
        cardInput: {
          type: CardTypeEnum.NOTE,
          text: "Test note",
        },
      };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("Invalid curator ID");
      }
    });
  });
});
