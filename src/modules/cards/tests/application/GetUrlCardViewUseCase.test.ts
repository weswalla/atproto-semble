import { GetUrlCardViewUseCase } from "../../application/useCases/queries/GetUrlCardViewUseCase";
import { InMemoryCardQueryRepository } from "../utils/InMemoryCardQueryRepository";
import { FakeProfileService } from "../utils/FakeProfileService";
import { CuratorId } from "../../../annotations/domain/value-objects/CuratorId";
import { CardId } from "../../domain/value-objects/CardId";
import {
  UrlCardQueryResultDTO,
  UrlCardViewDTO,
} from "../../domain/ICardQueryRepository";
import { CardTypeEnum } from "../../domain/value-objects/CardType";
import { UniqueEntityID } from "../../../../shared/domain/UniqueEntityID";

describe("GetUrlCardViewUseCase", () => {
  let useCase: GetUrlCardViewUseCase;
  let cardQueryRepo: InMemoryCardQueryRepository;
  let profileService: FakeProfileService;
  let curatorId: CuratorId;
  let otherCuratorId: CuratorId;
  let cardId: string;

  beforeEach(() => {
    cardQueryRepo = new InMemoryCardQueryRepository();
    profileService = new FakeProfileService();
    useCase = new GetUrlCardViewUseCase(cardQueryRepo, profileService);

    curatorId = CuratorId.create("did:plc:testcurator").unwrap();
    otherCuratorId = CuratorId.create("did:plc:othercurator").unwrap();
    cardId = new UniqueEntityID().toString();

    // Set up profiles for the curators
    profileService.addProfile({
      id: curatorId.value,
      name: "Test Curator",
      handle: "testcurator",
      avatarUrl: "https://example.com/avatar1.jpg",
      bio: "Test curator bio",
    });

    profileService.addProfile({
      id: otherCuratorId.value,
      name: "Other Curator",
      handle: "othercurator",
      avatarUrl: "https://example.com/avatar2.jpg",
      bio: "Other curator bio",
    });
  });

  afterEach(() => {
    cardQueryRepo.clear();
    profileService.clear();
  });

  describe("Basic functionality", () => {
    it("should return URL card view with enriched library data", async () => {
      // Create test URL card
      const urlCard: UrlCardQueryResultDTO = {
        id: cardId,
        type: CardTypeEnum.URL,
        url: "https://example.com/article1",
        cardContent: {
          url: "https://example.com/article1",
          title: "Test Article",
          description: "Description of test article",
          author: "John Doe",
          thumbnailUrl: "https://example.com/thumb1.jpg",
        },
        libraryCount: 2,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
        collections: [
          {
            id: new UniqueEntityID().toString(),
            name: "Reading List",
            authorId: curatorId.value,
          },
        ],
        note: {
          id: new UniqueEntityID().toString(),
          text: "This is my note about the article",
        },
      };

      // Create the card view with libraries
      const urlCardView: UrlCardViewDTO = {
        ...urlCard,
        libraries: [
          { userId: curatorId.value },
          { userId: otherCuratorId.value },
        ],
      };

      cardQueryRepo.addUrlCard(urlCard);
      cardQueryRepo.addCardToUserLibrary(curatorId.value, cardId);
      cardQueryRepo.addCardToUserLibrary(otherCuratorId.value, cardId);

      const query = {
        cardId: cardId,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();

      // Verify basic card data
      expect(response.id).toBe(cardId);
      expect(response.type).toBe(CardTypeEnum.URL);
      expect(response.url).toBe("https://example.com/article1");
      expect(response.cardContent.title).toBe("Test Article");
      expect(response.cardContent.description).toBe(
        "Description of test article"
      );
      expect(response.cardContent.author).toBe("John Doe");
      expect(response.cardContent.thumbnailUrl).toBe(
        "https://example.com/thumb1.jpg"
      );
      expect(response.libraryCount).toBe(2);

      // Verify collections
      expect(response.collections).toHaveLength(1);
      expect(response.collections[0]?.name).toBe("Reading List");
      expect(response.collections[0]?.authorId).toBe(curatorId.value);

      // Verify note
      expect(response.note).toBeDefined();
      expect(response.note?.text).toBe("This is my note about the article");

      // Verify enriched library data
      expect(response.libraries).toHaveLength(2);

      const testCuratorLib = response.libraries.find(
        (lib) => lib.userId === curatorId.value
      );
      expect(testCuratorLib).toBeDefined();
      expect(testCuratorLib?.name).toBe("Test Curator");
      expect(testCuratorLib?.handle).toBe("testcurator");
      expect(testCuratorLib?.avatarUrl).toBe("https://example.com/avatar1.jpg");

      const otherCuratorLib = response.libraries.find(
        (lib) => lib.userId === otherCuratorId.value
      );
      expect(otherCuratorLib).toBeDefined();
      expect(otherCuratorLib?.name).toBe("Other Curator");
      expect(otherCuratorLib?.handle).toBe("othercurator");
      expect(otherCuratorLib?.avatarUrl).toBe(
        "https://example.com/avatar2.jpg"
      );
    });

    it("should return URL card view with no libraries", async () => {
      const urlCard: UrlCardQueryResultDTO = {
        id: cardId,
        type: CardTypeEnum.URL,
        url: "https://example.com/lonely-article",
        cardContent: {
          url: "https://example.com/lonely-article",
          title: "Lonely Article",
          description: "An article with no libraries",
        },
        libraryCount: 0,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
        collections: [],
      };

      const urlCardView: UrlCardViewDTO = {
        ...urlCard,
        libraries: [],
      };

      cardQueryRepo.addUrlCard(urlCard);

      const query = {
        cardId: cardId,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.libraries).toHaveLength(0);
      expect(response.collections).toHaveLength(0);
      expect(response.note).toBeUndefined();
    });

    it("should return URL card view with minimal metadata", async () => {
      const urlCard: UrlCardQueryResultDTO = {
        id: cardId,
        type: CardTypeEnum.URL,
        url: "https://example.com/minimal",
        cardContent: {
          url: "https://example.com/minimal",
        },
        libraryCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        collections: [],
      };

      const urlCardView: UrlCardViewDTO = {
        ...urlCard,
        libraries: [{ userId: curatorId.value }],
      };

      cardQueryRepo.addUrlCard(urlCard);
      cardQueryRepo.addCardToUserLibrary(curatorId.value, cardId);

      const query = {
        cardId: cardId,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.cardContent.title).toBeUndefined();
      expect(response.cardContent.description).toBeUndefined();
      expect(response.cardContent.author).toBeUndefined();
      expect(response.cardContent.thumbnailUrl).toBeUndefined();
      expect(response.libraries).toHaveLength(1);
    });

    it("should handle profiles with minimal data", async () => {
      // Add a curator with minimal profile data
      const minimalCuratorId = CuratorId.create("did:plc:minimal").unwrap();
      profileService.addProfile({
        id: minimalCuratorId.value,
        name: "Minimal User",
        handle: "minimal",
        // No avatarUrl or bio
      });

      const urlCard: UrlCardQueryResultDTO = {
        id: cardId,
        type: CardTypeEnum.URL,
        url: "https://example.com/test",
        cardContent: {
          url: "https://example.com/test",
          title: "Test Article",
        },
        libraryCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        collections: [],
      };

      const urlCardView: UrlCardViewDTO = {
        ...urlCard,
        libraries: [{ userId: minimalCuratorId.value }],
      };

      cardQueryRepo.addUrlCard(urlCard);
      cardQueryRepo.addCardToUserLibrary(minimalCuratorId.value, cardId);

      const query = {
        cardId: cardId,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.libraries).toHaveLength(1);
      expect(response.libraries[0]?.name).toBe("Minimal User");
      expect(response.libraries[0]?.handle).toBe("minimal");
      expect(response.libraries[0]?.avatarUrl).toBeUndefined();
    });
  });

  describe("Error handling", () => {
    it("should fail with invalid card ID", async () => {
      const query = {
        cardId: "invalid-card-id",
      };

      const result = await useCase.execute(query);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("URL card not found");
      }
    });

    it("should fail when card not found", async () => {
      const nonExistentCardId = new UniqueEntityID().toString();

      const query = {
        cardId: nonExistentCardId,
      };

      const result = await useCase.execute(query);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("URL card not found");
      }
    });

    it("should fail when profile service fails", async () => {
      const urlCard: UrlCardQueryResultDTO = {
        id: cardId,
        type: CardTypeEnum.URL,
        url: "https://example.com/test",
        cardContent: {
          url: "https://example.com/test",
          title: "Test Article",
        },
        libraryCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        collections: [],
      };

      const urlCardView: UrlCardViewDTO = {
        ...urlCard,
        libraries: [{ userId: curatorId.value }],
      };

      cardQueryRepo.addUrlCard(urlCard);
      cardQueryRepo.addCardToUserLibrary(curatorId.value, cardId);

      // Make profile service fail
      profileService.setShouldFail(true);

      const query = {
        cardId: cardId,
      };

      const result = await useCase.execute(query);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("Failed to fetch user profiles");
      }
    });

    it("should fail when user profile not found", async () => {
      const unknownUserId = "did:plc:unknown";

      const urlCard: UrlCardQueryResultDTO = {
        id: cardId,
        type: CardTypeEnum.URL,
        url: "https://example.com/test",
        cardContent: {
          url: "https://example.com/test",
          title: "Test Article",
        },
        libraryCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        collections: [],
      };

      const urlCardView: UrlCardViewDTO = {
        ...urlCard,
        libraries: [{ userId: unknownUserId }],
      };

      cardQueryRepo.addUrlCard(urlCard);
      cardQueryRepo.addCardToUserLibrary(unknownUserId, cardId);

      const query = {
        cardId: cardId,
      };

      const result = await useCase.execute(query);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("Failed to fetch user profiles");
      }
    });

    it("should handle repository errors gracefully", async () => {
      // Create a mock repository that throws an error
      const errorRepo = {
        getUrlCardsOfUser: jest.fn(),
        getCardsInCollection: jest.fn(),
        getUrlCardView: jest
          .fn()
          .mockRejectedValue(new Error("Database connection failed")),
      };

      const errorUseCase = new GetUrlCardViewUseCase(errorRepo, profileService);

      const query = {
        cardId: cardId,
      };

      const result = await errorUseCase.execute(query);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain(
          "Failed to retrieve URL card view"
        );
        expect(result.error.message).toContain("Database connection failed");
      }
    });
  });

  describe("Edge cases", () => {
    it("should handle card with many libraries", async () => {
      // Create multiple users
      const userIds: string[] = [];
      for (let i = 1; i <= 5; i++) {
        const userId = `did:plc:user${i}`;
        userIds.push(userId);
        profileService.addProfile({
          id: userId,
          name: `User ${i}`,
          handle: `user${i}`,
          avatarUrl: `https://example.com/avatar${i}.jpg`,
        });
      }

      const urlCard: UrlCardQueryResultDTO = {
        id: cardId,
        type: CardTypeEnum.URL,
        url: "https://example.com/popular-article",
        cardContent: {
          url: "https://example.com/popular-article",
          title: "Very Popular Article",
        },
        libraryCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        collections: [],
      };

      const urlCardView: UrlCardViewDTO = {
        ...urlCard,
        libraries: userIds.map((userId) => ({ userId })),
      };

      cardQueryRepo.addUrlCard(urlCard);
      userIds.forEach((userId) => {
        cardQueryRepo.addCardToUserLibrary(userId, cardId);
      });

      const query = {
        cardId: cardId,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.libraries).toHaveLength(5);

      // Verify all users are included with correct profile data
      userIds.forEach((userId, index) => {
        const userLib = response.libraries.find((lib) => lib.userId === userId);
        expect(userLib).toBeDefined();
        expect(userLib?.name).toBe(`User ${index + 1}`);
        expect(userLib?.handle).toBe(`user${index + 1}`);
        expect(userLib?.avatarUrl).toBe(
          `https://example.com/avatar${index + 1}.jpg`
        );
      });
    });

    it("should handle card with many collections", async () => {
      const collections = [];
      for (let i = 1; i <= 3; i++) {
        collections.push({
          id: new UniqueEntityID().toString(),
          name: `Collection ${i}`,
          authorId: curatorId.value,
        });
      }

      const urlCard: UrlCardQueryResultDTO = {
        id: cardId,
        type: CardTypeEnum.URL,
        url: "https://example.com/well-organized",
        cardContent: {
          url: "https://example.com/well-organized",
          title: "Well Organized Article",
        },
        libraryCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        collections: collections,
      };

      const urlCardView: UrlCardViewDTO = {
        ...urlCard,
        libraries: [{ userId: curatorId.value }],
      };

      cardQueryRepo.addUrlCard(urlCard);
      cardQueryRepo.addCardToUserLibrary(curatorId.value, cardId);

      const query = {
        cardId: cardId,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.collections).toHaveLength(3);
      expect(response.collections[0]?.name).toBe("Collection 1");
      expect(response.collections[1]?.name).toBe("Collection 2");
      expect(response.collections[2]?.name).toBe("Collection 3");
    });

    it("should handle card with high library count", async () => {
      const urlCard: UrlCardQueryResultDTO = {
        id: cardId,
        type: CardTypeEnum.URL,
        url: "https://example.com/viral",
        cardContent: {
          url: "https://example.com/viral",
          title: "Viral Article",
        },
        libraryCount: 9999,
        createdAt: new Date(),
        updatedAt: new Date(),
        collections: [],
      };

      const urlCardView: UrlCardViewDTO = {
        ...urlCard,
        libraries: [{ userId: curatorId.value }],
      };

      cardQueryRepo.addUrlCard(urlCard);
      cardQueryRepo.addCardToUserLibrary(curatorId.value, cardId);

      const query = {
        cardId: cardId,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.libraryCount).toBe(9999);
      expect(response.libraries).toHaveLength(1);
    });

    it("should handle empty card ID", async () => {
      const query = {
        cardId: "",
      };

      const result = await useCase.execute(query);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("URL card not found");
      }
    });
  });
});
