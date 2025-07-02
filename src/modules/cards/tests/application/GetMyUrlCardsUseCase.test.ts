import { GetMyUrlCardsUseCase } from "../../application/useCases/queries/GetMyUrlCardsUseCase";
import { InMemoryCardQueryRepository } from "../utils/InMemoryCardQueryRepository";
import { CuratorId } from "../../../annotations/domain/value-objects/CuratorId";
import { CardSortField, SortOrder, UrlCardQueryResultDTO } from "../../domain/ICardQueryRepository";
import { UniqueEntityID } from "../../../../shared/domain/UniqueEntityID";

describe("GetMyUrlCardsUseCase", () => {
  let useCase: GetMyUrlCardsUseCase;
  let cardQueryRepo: InMemoryCardQueryRepository;
  let curatorId: CuratorId;

  beforeEach(() => {
    cardQueryRepo = new InMemoryCardQueryRepository();
    useCase = new GetMyUrlCardsUseCase(cardQueryRepo);

    curatorId = CuratorId.create("did:plc:testcurator").unwrap();
  });

  afterEach(() => {
    cardQueryRepo.clear();
  });

  describe("Basic functionality", () => {
    it("should return empty cards list when user has no URL cards", async () => {
      const query = {
        userId: curatorId.value,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.cards).toHaveLength(0);
      expect(response.pagination.totalCount).toBe(0);
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.hasMore).toBe(false);
    });

    it("should return user's URL cards", async () => {
      // Create test URL cards
      const urlCard1: UrlCardQueryResultDTO = {
        id: new UniqueEntityID().toString(),
        url: "https://example.com/article1",
        urlMeta: {
          title: "First Article",
          description: "Description of first article",
          author: "John Doe",
          thumbnailUrl: "https://example.com/thumb1.jpg",
        },
        libraryCount: 1,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
        collections: [],
        note: undefined,
      };

      const urlCard2: UrlCardQueryResultDTO = {
        id: new UniqueEntityID().toString(),
        url: "https://example.com/article2",
        urlMeta: {
          title: "Second Article",
          description: "Description of second article",
          author: "Jane Smith",
        },
        libraryCount: 2,
        createdAt: new Date("2023-01-02"),
        updatedAt: new Date("2023-01-02"),
        collections: [],
        note: undefined,
      };

      cardQueryRepo.addUrlCard(urlCard1);
      cardQueryRepo.addUrlCard(urlCard2);
      cardQueryRepo.addCardToUserLibrary(curatorId.value, urlCard1.id);
      cardQueryRepo.addCardToUserLibrary(curatorId.value, urlCard2.id);

      const query = {
        userId: curatorId.value,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.cards).toHaveLength(2);
      expect(response.pagination.totalCount).toBe(2);

      // Verify card data
      const firstCard = response.cards.find(card => card.url === urlCard1.url);
      const secondCard = response.cards.find(card => card.url === urlCard2.url);

      expect(firstCard).toBeDefined();
      expect(firstCard?.urlMeta.title).toBe("First Article");
      expect(firstCard?.urlMeta.author).toBe("John Doe");
      expect(firstCard?.libraryCount).toBe(1);

      expect(secondCard).toBeDefined();
      expect(secondCard?.urlMeta.title).toBe("Second Article");
      expect(secondCard?.libraryCount).toBe(2);
    });

    it("should include collections and notes in URL cards", async () => {
      const urlCard: UrlCardQueryResultDTO = {
        id: new UniqueEntityID().toString(),
        url: "https://example.com/article-with-extras",
        urlMeta: {
          title: "Article with Collections and Note",
          description: "An article with associated data",
        },
        libraryCount: 1,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
        collections: [
          {
            id: new UniqueEntityID().toString(),
            name: "Reading List",
            authorId: curatorId.value,
          },
          {
            id: new UniqueEntityID().toString(),
            name: "Favorites",
            authorId: curatorId.value,
          },
        ],
        note: {
          id: new UniqueEntityID().toString(),
          text: "This is my note about the article",
        },
      };

      cardQueryRepo.addUrlCard(urlCard);
      cardQueryRepo.addCardToUserLibrary(curatorId.value, urlCard.id);

      const query = {
        userId: curatorId.value,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.cards).toHaveLength(1);

      const card = response.cards[0]!;
      expect(card.collections).toHaveLength(2);
      expect(card.collections[0]?.name).toBe("Reading List");
      expect(card.collections[1]?.name).toBe("Favorites");
      expect(card.note).toBeDefined();
      expect(card.note?.text).toBe("This is my note about the article");
    });

    it("should only return URL cards for the specified user", async () => {
      const otherCuratorId = CuratorId.create("did:plc:othercurator").unwrap();

      const myCard: UrlCardQueryResultDTO = {
        id: new UniqueEntityID().toString(),
        url: "https://example.com/my-article",
        urlMeta: { title: "My Article" },
        libraryCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        collections: [],
      };

      const otherCard: UrlCardQueryResultDTO = {
        id: new UniqueEntityID().toString(),
        url: "https://example.com/other-article",
        urlMeta: { title: "Other Article" },
        libraryCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        collections: [],
      };

      cardQueryRepo.addUrlCard(myCard);
      cardQueryRepo.addUrlCard(otherCard);
      cardQueryRepo.addCardToUserLibrary(curatorId.value, myCard.id);
      cardQueryRepo.addCardToUserLibrary(otherCuratorId.value, otherCard.id);

      const query = {
        userId: curatorId.value,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.cards).toHaveLength(1);
      expect(response.cards[0]?.urlMeta.title).toBe("My Article");
    });
  });

  describe("Pagination", () => {
    beforeEach(() => {
      // Create multiple URL cards for pagination testing
      for (let i = 1; i <= 5; i++) {
        const urlCard: UrlCardQueryResultDTO = {
          id: new UniqueEntityID().toString(),
          url: `https://example.com/article${i}`,
          urlMeta: {
            title: `Article ${i}`,
            description: `Description of article ${i}`,
          },
          libraryCount: 1,
          createdAt: new Date(`2023-01-${i.toString().padStart(2, "0")}`),
          updatedAt: new Date(`2023-01-${i.toString().padStart(2, "0")}`),
          collections: [],
        };

        cardQueryRepo.addUrlCard(urlCard);
        cardQueryRepo.addCardToUserLibrary(curatorId.value, urlCard.id);
      }
    });

    it("should handle pagination correctly", async () => {
      const query = {
        userId: curatorId.value,
        page: 1,
        limit: 2,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.cards).toHaveLength(2);
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.totalPages).toBe(3);
      expect(response.pagination.totalCount).toBe(5);
      expect(response.pagination.hasMore).toBe(true);
      expect(response.pagination.limit).toBe(2);
    });

    it("should handle second page correctly", async () => {
      const query = {
        userId: curatorId.value,
        page: 2,
        limit: 2,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.cards).toHaveLength(2);
      expect(response.pagination.currentPage).toBe(2);
      expect(response.pagination.hasMore).toBe(true);
    });

    it("should handle last page correctly", async () => {
      const query = {
        userId: curatorId.value,
        page: 3,
        limit: 2,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.cards).toHaveLength(1);
      expect(response.pagination.currentPage).toBe(3);
      expect(response.pagination.hasMore).toBe(false);
    });

    it("should cap limit at 100", async () => {
      const query = {
        userId: curatorId.value,
        limit: 150, // Should be capped at 100
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.pagination.limit).toBe(100);
    });
  });

  describe("Sorting", () => {
    beforeEach(() => {
      // Create URL cards with different properties for sorting
      const now = new Date();

      const card1: UrlCardQueryResultDTO = {
        id: new UniqueEntityID().toString(),
        url: "https://example.com/alpha",
        urlMeta: { title: "Alpha Article" },
        libraryCount: 1,
        createdAt: new Date(now.getTime() - 2000),
        updatedAt: new Date(now.getTime() - 1000),
        collections: [],
      };

      const card2: UrlCardQueryResultDTO = {
        id: new UniqueEntityID().toString(),
        url: "https://example.com/beta",
        urlMeta: { title: "Beta Article" },
        libraryCount: 3,
        createdAt: new Date(now.getTime() - 1000),
        updatedAt: new Date(now.getTime() - 2000),
        collections: [],
      };

      const card3: UrlCardQueryResultDTO = {
        id: new UniqueEntityID().toString(),
        url: "https://example.com/gamma",
        urlMeta: { title: "Gamma Article" },
        libraryCount: 2,
        createdAt: new Date(now.getTime()),
        updatedAt: new Date(now.getTime()),
        collections: [],
      };

      cardQueryRepo.addUrlCard(card1);
      cardQueryRepo.addUrlCard(card2);
      cardQueryRepo.addUrlCard(card3);
      cardQueryRepo.addCardToUserLibrary(curatorId.value, card1.id);
      cardQueryRepo.addCardToUserLibrary(curatorId.value, card2.id);
      cardQueryRepo.addCardToUserLibrary(curatorId.value, card3.id);
    });

    it("should sort by library count descending", async () => {
      const query = {
        userId: curatorId.value,
        sortBy: CardSortField.LIBRARY_COUNT,
        sortOrder: SortOrder.DESC,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.cards).toHaveLength(3);
      expect(response.cards[0]?.libraryCount).toBe(3); // beta
      expect(response.cards[1]?.libraryCount).toBe(2); // gamma
      expect(response.cards[2]?.libraryCount).toBe(1); // alpha
      expect(response.sorting.sortBy).toBe(CardSortField.LIBRARY_COUNT);
      expect(response.sorting.sortOrder).toBe(SortOrder.DESC);
    });

    it("should sort by library count ascending", async () => {
      const query = {
        userId: curatorId.value,
        sortBy: CardSortField.LIBRARY_COUNT,
        sortOrder: SortOrder.ASC,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.cards[0]?.libraryCount).toBe(1); // alpha
      expect(response.cards[1]?.libraryCount).toBe(2); // gamma
      expect(response.cards[2]?.libraryCount).toBe(3); // beta
    });

    it("should sort by updated date descending", async () => {
      const query = {
        userId: curatorId.value,
        sortBy: CardSortField.UPDATED_AT,
        sortOrder: SortOrder.DESC,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.cards[0]?.urlMeta.title).toBe("Gamma Article"); // most recent
      expect(response.cards[1]?.urlMeta.title).toBe("Alpha Article");
      expect(response.cards[2]?.urlMeta.title).toBe("Beta Article"); // oldest
    });

    it("should sort by created date ascending", async () => {
      const query = {
        userId: curatorId.value,
        sortBy: CardSortField.CREATED_AT,
        sortOrder: SortOrder.ASC,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.cards[0]?.urlMeta.title).toBe("Alpha Article"); // oldest
      expect(response.cards[1]?.urlMeta.title).toBe("Beta Article");
      expect(response.cards[2]?.urlMeta.title).toBe("Gamma Article"); // newest
    });

    it("should use default sorting when not specified", async () => {
      const query = {
        userId: curatorId.value,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.sorting.sortBy).toBe(CardSortField.UPDATED_AT);
      expect(response.sorting.sortOrder).toBe(SortOrder.DESC);
    });
  });

  describe("Error handling", () => {
    it("should fail with invalid user ID", async () => {
      const query = {
        userId: "invalid-user-id",
      };

      const result = await useCase.execute(query);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("Invalid user ID");
      }
    });

    it("should handle repository errors gracefully", async () => {
      // Create a mock repository that throws an error
      const errorRepo = {
        getUrlCardsOfUser: jest.fn().mockRejectedValue(new Error("Database connection failed")),
      };

      const errorUseCase = new GetMyUrlCardsUseCase(errorRepo);

      const query = {
        userId: curatorId.value,
      };

      const result = await errorUseCase.execute(query);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("Failed to retrieve URL cards");
        expect(result.error.message).toContain("Database connection failed");
      }
    });
  });

  describe("Edge cases", () => {
    it("should handle URL cards with minimal metadata", async () => {
      const urlCard: UrlCardQueryResultDTO = {
        id: new UniqueEntityID().toString(),
        url: "https://example.com/minimal",
        urlMeta: {}, // No metadata
        libraryCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        collections: [],
      };

      cardQueryRepo.addUrlCard(urlCard);
      cardQueryRepo.addCardToUserLibrary(curatorId.value, urlCard.id);

      const query = {
        userId: curatorId.value,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.cards).toHaveLength(1);
      expect(response.cards[0]?.urlMeta.title).toBeUndefined();
      expect(response.cards[0]?.urlMeta.description).toBeUndefined();
      expect(response.cards[0]?.urlMeta.author).toBeUndefined();
      expect(response.cards[0]?.urlMeta.thumbnailUrl).toBeUndefined();
    });

    it("should handle URL cards with high library counts", async () => {
      const urlCard: UrlCardQueryResultDTO = {
        id: new UniqueEntityID().toString(),
        url: "https://example.com/popular",
        urlMeta: { title: "Very Popular Article" },
        libraryCount: 9999,
        createdAt: new Date(),
        updatedAt: new Date(),
        collections: [],
      };

      cardQueryRepo.addUrlCard(urlCard);
      cardQueryRepo.addCardToUserLibrary(curatorId.value, urlCard.id);

      const query = {
        userId: curatorId.value,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.cards).toHaveLength(1);
      expect(response.cards[0]?.libraryCount).toBe(9999);
    });

    it("should handle empty collections array", async () => {
      const urlCard: UrlCardQueryResultDTO = {
        id: new UniqueEntityID().toString(),
        url: "https://example.com/no-collections",
        urlMeta: { title: "Article with No Collections" },
        libraryCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        collections: [],
      };

      cardQueryRepo.addUrlCard(urlCard);
      cardQueryRepo.addCardToUserLibrary(curatorId.value, urlCard.id);

      const query = {
        userId: curatorId.value,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.cards).toHaveLength(1);
      expect(response.cards[0]?.collections).toEqual([]);
    });
  });
});
