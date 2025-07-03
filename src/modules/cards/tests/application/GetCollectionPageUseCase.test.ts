import { GetCollectionPageUseCase } from "../../application/useCases/queries/GetCollectionPageUseCase";
import { InMemoryCardQueryRepository } from "../utils/InMemoryCardQueryRepository";
import { InMemoryCollectionRepository } from "../utils/InMemoryCollectionRepository";
import { FakeProfileService } from "../utils/FakeProfileService";
import { CuratorId } from "../../../annotations/domain/value-objects/CuratorId";
import { CollectionId } from "../../domain/value-objects/CollectionId";
import { Collection, CollectionAccessType } from "../../domain/Collection";
import {
  CardSortField,
  SortOrder,
  CollectionCardQueryResultDTO,
} from "../../domain/ICardQueryRepository";
import { CardTypeEnum } from "../../domain/value-objects/CardType";
import { UniqueEntityID } from "../../../../shared/domain/UniqueEntityID";

describe("GetCollectionPageUseCase", () => {
  let useCase: GetCollectionPageUseCase;
  let collectionRepo: InMemoryCollectionRepository;
  let cardQueryRepo: InMemoryCardQueryRepository;
  let profileService: FakeProfileService;
  let curatorId: CuratorId;
  let collectionId: CollectionId;

  beforeEach(() => {
    collectionRepo = new InMemoryCollectionRepository();
    cardQueryRepo = new InMemoryCardQueryRepository();
    profileService = new FakeProfileService();
    useCase = new GetCollectionPageUseCase(
      collectionRepo,
      cardQueryRepo,
      profileService
    );

    curatorId = CuratorId.create("did:plc:testcurator").unwrap();
    collectionId = CollectionId.create(new UniqueEntityID()).unwrap();

    // Set up profile for the curator
    profileService.addProfile({
      id: curatorId.value,
      name: "Test Curator",
      handle: "testcurator",
      avatarUrl: "https://example.com/avatar.jpg",
      bio: "Test curator bio",
    });
  });

  afterEach(() => {
    collectionRepo.clear();
    cardQueryRepo.clear();
    profileService.clear();
  });

  describe("Basic functionality", () => {
    it("should return collection page with empty cards when collection has no cards", async () => {
      // Create collection
      const collection = Collection.create(
        {
          authorId: curatorId,
          name: "Empty Collection",
          description: "A collection with no cards",
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        collectionId.getValue()
      ).unwrap();

      await collectionRepo.save(collection);

      const query = {
        collectionId: collectionId.getStringValue(),
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.id).toBe(collectionId.getStringValue());
      expect(response.name).toBe("Empty Collection");
      expect(response.description).toBe("A collection with no cards");
      expect(response.author.id).toBe(curatorId.value);
      expect(response.author.name).toBe("Test Curator");
      expect(response.author.handle).toBe("testcurator");
      expect(response.author.avatarUrl).toBe("https://example.com/avatar.jpg");
      expect(response.urlCards).toHaveLength(0);
      expect(response.pagination.totalCount).toBe(0);
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.hasMore).toBe(false);
    });

    it("should return collection page with URL cards", async () => {
      // Create collection
      const collection = Collection.create(
        {
          authorId: curatorId,
          name: "Test Collection",
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        collectionId.getValue()
      ).unwrap();

      await collectionRepo.save(collection);

      // Create test URL cards
      const urlCard1: CollectionCardQueryResultDTO = {
        id: new UniqueEntityID().toString(),
        type: CardTypeEnum.URL,
        url: "https://example.com/article1",
        cardContent: {
          url: "https://example.com/article1",
          title: "First Article",
          description: "Description of first article",
          author: "John Doe",
          thumbnailUrl: "https://example.com/thumb1.jpg",
        },
        libraryCount: 1,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
        note: undefined,
      };

      const urlCard2: CollectionCardQueryResultDTO = {
        id: new UniqueEntityID().toString(),
        type: CardTypeEnum.URL,
        url: "https://example.com/article2",
        cardContent: {
          url: "https://example.com/article2",
          title: "Second Article",
          description: "Description of second article",
          author: "Jane Smith",
        },
        libraryCount: 2,
        createdAt: new Date("2023-01-02"),
        updatedAt: new Date("2023-01-02"),
        note: undefined,
      };

      cardQueryRepo.addUrlCard({
        ...urlCard1,
        collections: [],
      });
      cardQueryRepo.addUrlCard({
        ...urlCard2,
        collections: [],
      });
      cardQueryRepo.addCardToCollection(
        collectionId.getStringValue(),
        urlCard1.id
      );
      cardQueryRepo.addCardToCollection(
        collectionId.getStringValue(),
        urlCard2.id
      );

      const query = {
        collectionId: collectionId.getStringValue(),
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.urlCards).toHaveLength(2);
      expect(response.pagination.totalCount).toBe(2);

      // Verify card data
      const firstCard = response.urlCards.find(
        (card) => card.url === urlCard1.url
      );
      const secondCard = response.urlCards.find(
        (card) => card.url === urlCard2.url
      );

      expect(firstCard).toBeDefined();
      expect(firstCard?.cardContent.title).toBe("First Article");
      expect(firstCard?.cardContent.author).toBe("John Doe");
      expect(firstCard?.libraryCount).toBe(1);

      expect(secondCard).toBeDefined();
      expect(secondCard?.cardContent.title).toBe("Second Article");
      expect(secondCard?.libraryCount).toBe(2);
    });

    it("should include notes in URL cards", async () => {
      // Create collection
      const collection = Collection.create(
        {
          authorId: curatorId,
          name: "Collection with Notes",
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        collectionId.getValue()
      ).unwrap();

      await collectionRepo.save(collection);

      const urlCard: CollectionCardQueryResultDTO = {
        id: new UniqueEntityID().toString(),
        type: CardTypeEnum.URL,
        url: "https://example.com/article-with-note",
        cardContent: {
          url: "https://example.com/article-with-note",
          title: "Article with Note",
          description: "An article with an associated note",
        },
        libraryCount: 1,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
        note: {
          id: new UniqueEntityID().toString(),
          text: "This is my note about the article",
        },
      };

      cardQueryRepo.addUrlCard({
        ...urlCard,
        collections: [],
      });
      cardQueryRepo.addCardToCollection(
        collectionId.getStringValue(),
        urlCard.id
      );

      const query = {
        collectionId: collectionId.getStringValue(),
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.urlCards).toHaveLength(1);

      const card = response.urlCards[0]!;
      expect(card.note).toBeDefined();
      expect(card.note?.text).toBe("This is my note about the article");
    });

    it("should handle collection without description", async () => {
      // Create collection without description
      const collection = Collection.create(
        {
          authorId: curatorId,
          name: "No Description Collection",
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        collectionId.getValue()
      ).unwrap();

      await collectionRepo.save(collection);

      const query = {
        collectionId: collectionId.getStringValue(),
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.description).toBeUndefined();
    });
  });

  describe("Pagination", () => {
    beforeEach(async () => {
      // Create collection
      const collection = Collection.create(
        {
          authorId: curatorId,
          name: "Large Collection",
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        collectionId.getValue()
      ).unwrap();

      await collectionRepo.save(collection);

      // Create multiple URL cards for pagination testing
      for (let i = 1; i <= 5; i++) {
        const urlCard: CollectionCardQueryResultDTO = {
          id: new UniqueEntityID().toString(),
          type: CardTypeEnum.URL,
          url: `https://example.com/article${i}`,
          cardContent: {
            url: `https://example.com/article${i}`,
            title: `Article ${i}`,
            description: `Description of article ${i}`,
          },
          libraryCount: 1,
          createdAt: new Date(`2023-01-${i.toString().padStart(2, "0")}`),
          updatedAt: new Date(`2023-01-${i.toString().padStart(2, "0")}`),
        };

        cardQueryRepo.addUrlCard({
          ...urlCard,
          collections: [],
        });
        cardQueryRepo.addCardToCollection(
          collectionId.getStringValue(),
          urlCard.id
        );
      }
    });

    it("should handle pagination correctly", async () => {
      const query = {
        collectionId: collectionId.getStringValue(),
        page: 1,
        limit: 2,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.urlCards).toHaveLength(2);
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.totalPages).toBe(3);
      expect(response.pagination.totalCount).toBe(5);
      expect(response.pagination.hasMore).toBe(true);
      expect(response.pagination.limit).toBe(2);
    });

    it("should handle second page correctly", async () => {
      const query = {
        collectionId: collectionId.getStringValue(),
        page: 2,
        limit: 2,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.urlCards).toHaveLength(2);
      expect(response.pagination.currentPage).toBe(2);
      expect(response.pagination.hasMore).toBe(true);
    });

    it("should handle last page correctly", async () => {
      const query = {
        collectionId: collectionId.getStringValue(),
        page: 3,
        limit: 2,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.urlCards).toHaveLength(1);
      expect(response.pagination.currentPage).toBe(3);
      expect(response.pagination.hasMore).toBe(false);
    });

    it("should cap limit at 100", async () => {
      const query = {
        collectionId: collectionId.getStringValue(),
        limit: 150, // Should be capped at 100
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.pagination.limit).toBe(100);
    });
  });

  describe("Sorting", () => {
    beforeEach(async () => {
      // Create collection
      const collection = Collection.create(
        {
          authorId: curatorId,
          name: "Sortable Collection",
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        collectionId.getValue()
      ).unwrap();

      await collectionRepo.save(collection);

      // Create URL cards with different properties for sorting
      const now = new Date();

      const card1: CollectionCardQueryResultDTO = {
        id: new UniqueEntityID().toString(),
        type: CardTypeEnum.URL,
        url: "https://example.com/alpha",
        cardContent: {
          url: "https://example.com/alpha",
          title: "Alpha Article",
        },
        libraryCount: 1,
        createdAt: new Date(now.getTime() - 2000),
        updatedAt: new Date(now.getTime() - 1000),
      };

      const card2: CollectionCardQueryResultDTO = {
        id: new UniqueEntityID().toString(),
        type: CardTypeEnum.URL,
        url: "https://example.com/beta",
        cardContent: {
          url: "https://example.com/beta",
          title: "Beta Article",
        },
        libraryCount: 3,
        createdAt: new Date(now.getTime() - 1000),
        updatedAt: new Date(now.getTime() - 2000),
      };

      const card3: CollectionCardQueryResultDTO = {
        id: new UniqueEntityID().toString(),
        type: CardTypeEnum.URL,
        url: "https://example.com/gamma",
        cardContent: {
          url: "https://example.com/gamma",
          title: "Gamma Article",
        },
        libraryCount: 2,
        createdAt: new Date(now.getTime()),
        updatedAt: new Date(now.getTime()),
      };

      cardQueryRepo.addUrlCard({
        ...card1,
        collections: [],
      });
      cardQueryRepo.addUrlCard({
        ...card2,
        collections: [],
      });
      cardQueryRepo.addUrlCard({
        ...card3,
        collections: [],
      });
      cardQueryRepo.addCardToCollection(
        collectionId.getStringValue(),
        card1.id
      );
      cardQueryRepo.addCardToCollection(
        collectionId.getStringValue(),
        card2.id
      );
      cardQueryRepo.addCardToCollection(
        collectionId.getStringValue(),
        card3.id
      );
    });

    it("should sort by library count descending", async () => {
      const query = {
        collectionId: collectionId.getStringValue(),
        sortBy: CardSortField.LIBRARY_COUNT,
        sortOrder: SortOrder.DESC,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.urlCards).toHaveLength(3);
      expect(response.urlCards[0]?.libraryCount).toBe(3); // beta
      expect(response.urlCards[1]?.libraryCount).toBe(2); // gamma
      expect(response.urlCards[2]?.libraryCount).toBe(1); // alpha
      expect(response.sorting.sortBy).toBe(CardSortField.LIBRARY_COUNT);
      expect(response.sorting.sortOrder).toBe(SortOrder.DESC);
    });

    it("should sort by library count ascending", async () => {
      const query = {
        collectionId: collectionId.getStringValue(),
        sortBy: CardSortField.LIBRARY_COUNT,
        sortOrder: SortOrder.ASC,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.urlCards[0]?.libraryCount).toBe(1); // alpha
      expect(response.urlCards[1]?.libraryCount).toBe(2); // gamma
      expect(response.urlCards[2]?.libraryCount).toBe(3); // beta
    });

    it("should sort by updated date descending", async () => {
      const query = {
        collectionId: collectionId.getStringValue(),
        sortBy: CardSortField.UPDATED_AT,
        sortOrder: SortOrder.DESC,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.urlCards[0]?.cardContent.title).toBe("Gamma Article"); // most recent
      expect(response.urlCards[1]?.cardContent.title).toBe("Alpha Article");
      expect(response.urlCards[2]?.cardContent.title).toBe("Beta Article"); // oldest
    });

    it("should sort by created date ascending", async () => {
      const query = {
        collectionId: collectionId.getStringValue(),
        sortBy: CardSortField.CREATED_AT,
        sortOrder: SortOrder.ASC,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.urlCards[0]?.cardContent.title).toBe("Alpha Article"); // oldest
      expect(response.urlCards[1]?.cardContent.title).toBe("Beta Article");
      expect(response.urlCards[2]?.cardContent.title).toBe("Gamma Article"); // newest
    });

    it("should use default sorting when not specified", async () => {
      const query = {
        collectionId: collectionId.getStringValue(),
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.sorting.sortBy).toBe(CardSortField.UPDATED_AT);
      expect(response.sorting.sortOrder).toBe(SortOrder.DESC);
    });
  });

  describe("Error handling", () => {
    it("should fail with invalid collection ID", async () => {
      const query = {
        collectionId: "invalid-collection-id",
      };

      const result = await useCase.execute(query);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("Collection not found");
      }
    });

    it("should fail when collection not found", async () => {
      const nonExistentCollectionId = CollectionId.create(
        new UniqueEntityID()
      ).unwrap();

      const query = {
        collectionId: nonExistentCollectionId.getStringValue(),
      };

      const result = await useCase.execute(query);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("Collection not found");
      }
    });

    it("should fail when author profile not found", async () => {
      // Create collection with author that has no profile
      const unknownCuratorId = CuratorId.create(
        "did:plc:unknowncurator"
      ).unwrap();
      const collection = Collection.create(
        {
          authorId: unknownCuratorId,
          name: "Orphaned Collection",
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        collectionId.getValue()
      ).unwrap();

      await collectionRepo.save(collection);

      const query = {
        collectionId: collectionId.getStringValue(),
      };

      const result = await useCase.execute(query);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain(
          "Failed to fetch author profile"
        );
      }
    });

    it("should handle repository errors gracefully", async () => {
      // Create a mock collection repository that throws an error
      const errorCollectionRepo = {
        findById: jest
          .fn()
          .mockRejectedValue(new Error("Database connection failed")),
        save: jest.fn(),
        delete: jest.fn(),
        findByCuratorId: jest.fn(),
        findByCardId: jest.fn(),
      };

      const errorUseCase = new GetCollectionPageUseCase(
        errorCollectionRepo,
        cardQueryRepo,
        profileService
      );

      const query = {
        collectionId: collectionId.getStringValue(),
      };

      const result = await errorUseCase.execute(query);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain(
          "Failed to retrieve collection page"
        );
        expect(result.error.message).toContain("Database connection failed");
      }
    });

    it("should handle card query repository errors gracefully", async () => {
      // Create collection
      const collection = Collection.create(
        {
          authorId: curatorId,
          name: "Test Collection",
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        collectionId.getValue()
      ).unwrap();

      await collectionRepo.save(collection);

      // Create a mock card query repository that throws an error
      const errorCardQueryRepo = {
        getUrlCardsOfUser: jest.fn(),
        getCardsInCollection: jest
          .fn()
          .mockRejectedValue(new Error("Query failed")),
        getUrlCardView: jest.fn(),
        getLibrariesForCard: jest.fn(),
      };

      const errorUseCase = new GetCollectionPageUseCase(
        collectionRepo,
        errorCardQueryRepo,
        profileService
      );

      const query = {
        collectionId: collectionId.getStringValue(),
      };

      const result = await errorUseCase.execute(query);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain(
          "Failed to retrieve collection page"
        );
        expect(result.error.message).toContain("Query failed");
      }
    });
  });

  describe("Edge cases", () => {
    it("should handle URL cards with minimal metadata", async () => {
      // Create collection
      const collection = Collection.create(
        {
          authorId: curatorId,
          name: "Minimal Collection",
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        collectionId.getValue()
      ).unwrap();

      await collectionRepo.save(collection);

      const urlCard: CollectionCardQueryResultDTO = {
        id: new UniqueEntityID().toString(),
        type: CardTypeEnum.URL,
        url: "https://example.com/minimal",
        cardContent: {
          url: "https://example.com/minimal",
        }, // Minimal metadata
        libraryCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      cardQueryRepo.addUrlCard({
        ...urlCard,
        collections: [],
      });
      cardQueryRepo.addCardToCollection(
        collectionId.getStringValue(),
        urlCard.id
      );

      const query = {
        collectionId: collectionId.getStringValue(),
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.urlCards).toHaveLength(1);
      expect(response.urlCards[0]?.cardContent.title).toBeUndefined();
      expect(response.urlCards[0]?.cardContent.description).toBeUndefined();
      expect(response.urlCards[0]?.cardContent.author).toBeUndefined();
      expect(response.urlCards[0]?.cardContent.thumbnailUrl).toBeUndefined();
    });

    it("should handle URL cards with high library counts", async () => {
      // Create collection
      const collection = Collection.create(
        {
          authorId: curatorId,
          name: "Popular Collection",
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        collectionId.getValue()
      ).unwrap();

      await collectionRepo.save(collection);

      const urlCard: CollectionCardQueryResultDTO = {
        id: new UniqueEntityID().toString(),
        type: CardTypeEnum.URL,
        url: "https://example.com/popular",
        cardContent: {
          url: "https://example.com/popular",
          title: "Very Popular Article",
        },
        libraryCount: 9999,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      cardQueryRepo.addUrlCard({
        ...urlCard,
        collections: [],
      });
      cardQueryRepo.addCardToCollection(
        collectionId.getStringValue(),
        urlCard.id
      );

      const query = {
        collectionId: collectionId.getStringValue(),
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.urlCards).toHaveLength(1);
      expect(response.urlCards[0]?.libraryCount).toBe(9999);
    });

    it("should handle author profile with minimal data", async () => {
      // Create curator with minimal profile
      const minimalCuratorId = CuratorId.create(
        "did:plc:minimalcurator"
      ).unwrap();
      profileService.addProfile({
        id: minimalCuratorId.value,
        name: "Minimal Curator",
        handle: "minimal",
        // No avatarUrl or bio
      });

      const collection = Collection.create(
        {
          authorId: minimalCuratorId,
          name: "Minimal Author Collection",
          accessType: CollectionAccessType.OPEN,
          collaboratorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        collectionId.getValue()
      ).unwrap();

      await collectionRepo.save(collection);

      const query = {
        collectionId: collectionId.getStringValue(),
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.author.name).toBe("Minimal Curator");
      expect(response.author.handle).toBe("minimal");
      expect(response.author.avatarUrl).toBeUndefined();
    });
  });
});
