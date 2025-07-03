import { GetMyCollectionsUseCase } from "../../application/useCases/queries/GetMyCollectionsUseCase";
import { InMemoryCollectionQueryRepository } from "../utils/InMemoryCollectionQueryRepository";
import { FakeProfileService } from "../utils/FakeProfileService";
import { CuratorId } from "../../../annotations/domain/value-objects/CuratorId";
import { CollectionBuilder } from "../utils/builders/CollectionBuilder";
import { CollectionSortField, SortOrder } from "../../domain/ICollectionQueryRepository";
import { UserProfile } from "../../domain/services/IProfileService";

describe("GetMyCollectionsUseCase", () => {
  let useCase: GetMyCollectionsUseCase;
  let collectionQueryRepo: InMemoryCollectionQueryRepository;
  let profileService: FakeProfileService;
  let curatorId: CuratorId;
  let userProfile: UserProfile;

  beforeEach(() => {
    collectionQueryRepo = new InMemoryCollectionQueryRepository();
    profileService = new FakeProfileService();
    useCase = new GetMyCollectionsUseCase(collectionQueryRepo, profileService);

    curatorId = CuratorId.create("did:plc:testcurator").unwrap();
    userProfile = {
      id: curatorId.value,
      name: "Test Curator",
      handle: "testcurator.bsky.social",
      avatarUrl: "https://example.com/avatar.jpg",
      bio: "Test curator bio",
    };

    profileService.addProfile(userProfile);
  });

  afterEach(() => {
    collectionQueryRepo.clear();
    profileService.clear();
  });

  describe("Basic functionality", () => {
    it("should return empty collections list when curator has no collections", async () => {
      const query = {
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.collections).toHaveLength(0);
      expect(response.pagination.totalCount).toBe(0);
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.hasMore).toBe(false);
    });

    it("should return curator's collections with profile data", async () => {
      // Create test collections
      const collection1 = new CollectionBuilder()
        .withAuthorId(curatorId.value)
        .withName("First Collection")
        .withDescription("First collection description")
        .build();

      const collection2 = new CollectionBuilder()
        .withAuthorId(curatorId.value)
        .withName("Second Collection")
        .withDescription("Second collection description")
        .build();

      if (collection1 instanceof Error || collection2 instanceof Error) {
        throw new Error("Failed to create test collections");
      }

      collectionQueryRepo.addCollection(collection1);
      collectionQueryRepo.addCollection(collection2);

      const query = {
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.collections).toHaveLength(2);
      expect(response.pagination.totalCount).toBe(2);

      // Verify profile data is included
      const firstCollection = response.collections[0]!;
      expect(firstCollection.createdBy.id).toBe(userProfile.id);
      expect(firstCollection.createdBy.name).toBe(userProfile.name);
      expect(firstCollection.createdBy.handle).toBe(userProfile.handle);
      expect(firstCollection.createdBy.avatarUrl).toBe(userProfile.avatarUrl);
    });

    it("should only return collections for the specified curator", async () => {
      const otherCuratorId = CuratorId.create("did:plc:othercurator").unwrap();

      // Create collections for different curators
      const myCollection = new CollectionBuilder()
        .withAuthorId(curatorId.value)
        .withName("My Collection")
        .build();

      const otherCollection = new CollectionBuilder()
        .withAuthorId(otherCuratorId.value)
        .withName("Other Collection")
        .build();

      if (myCollection instanceof Error || otherCollection instanceof Error) {
        throw new Error("Failed to create test collections");
      }

      collectionQueryRepo.addCollection(myCollection);
      collectionQueryRepo.addCollection(otherCollection);

      const query = {
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.collections).toHaveLength(1);
      expect(response.collections[0]!.name).toBe("My Collection");
    });
  });

  describe("Pagination", () => {
    beforeEach(() => {
      // Create multiple collections for pagination testing
      for (let i = 1; i <= 5; i++) {
        const collection = new CollectionBuilder()
          .withAuthorId(curatorId.value)
          .withName(`Collection ${i}`)
          .build();

        if (collection instanceof Error) {
          throw new Error(`Failed to create collection ${i}`);
        }

        collectionQueryRepo.addCollection(collection);
      }
    });

    it("should handle pagination correctly", async () => {
      const query = {
        curatorId: curatorId.value,
        page: 1,
        limit: 2,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.collections).toHaveLength(2);
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.totalPages).toBe(3);
      expect(response.pagination.totalCount).toBe(5);
      expect(response.pagination.hasMore).toBe(true);
      expect(response.pagination.limit).toBe(2);
    });

    it("should handle second page correctly", async () => {
      const query = {
        curatorId: curatorId.value,
        page: 2,
        limit: 2,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.collections).toHaveLength(2);
      expect(response.pagination.currentPage).toBe(2);
      expect(response.pagination.hasMore).toBe(true);
    });

    it("should handle last page correctly", async () => {
      const query = {
        curatorId: curatorId.value,
        page: 3,
        limit: 2,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.collections).toHaveLength(1);
      expect(response.pagination.currentPage).toBe(3);
      expect(response.pagination.hasMore).toBe(false);
    });

    it("should cap limit at 100", async () => {
      const query = {
        curatorId: curatorId.value,
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
      // Create collections with different properties for sorting
      const now = new Date();
      
      const collection1 = new CollectionBuilder()
        .withAuthorId(curatorId.value)
        .withName("Alpha Collection")
        .withCreatedAt(new Date(now.getTime() - 2000))
        .withUpdatedAt(new Date(now.getTime() - 1000))
        .build();

      const collection2 = new CollectionBuilder()
        .withAuthorId(curatorId.value)
        .withName("Beta Collection")
        .withCreatedAt(new Date(now.getTime() - 1000))
        .withUpdatedAt(new Date(now.getTime() - 2000))
        .build();

      if (collection1 instanceof Error || collection2 instanceof Error) {
        throw new Error("Failed to create test collections");
      }

      collectionQueryRepo.addCollection(collection1);
      collectionQueryRepo.addCollection(collection2);
    });

    it("should sort by name ascending", async () => {
      const query = {
        curatorId: curatorId.value,
        sortBy: CollectionSortField.NAME,
        sortOrder: SortOrder.ASC,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.collections[0]!.name).toBe("Alpha Collection");
      expect(response.collections[1]!.name).toBe("Beta Collection");
      expect(response.sorting.sortBy).toBe(CollectionSortField.NAME);
      expect(response.sorting.sortOrder).toBe(SortOrder.ASC);
    });

    it("should sort by name descending", async () => {
      const query = {
        curatorId: curatorId.value,
        sortBy: CollectionSortField.NAME,
        sortOrder: SortOrder.DESC,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.collections[0]!.name).toBe("Beta Collection");
      expect(response.collections[1]!.name).toBe("Alpha Collection");
    });

    it("should use default sorting when not specified", async () => {
      const query = {
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(query);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.sorting.sortBy).toBe(CollectionSortField.UPDATED_AT);
      expect(response.sorting.sortOrder).toBe(SortOrder.DESC);
    });
  });

  describe("Error handling", () => {
    it("should fail with invalid curator ID", async () => {
      const query = {
        curatorId: "invalid-curator-id",
      };

      const result = await useCase.execute(query);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("Invalid curator ID");
      }
    });

    it("should fail when profile service fails", async () => {
      profileService.setShouldFail(true);

      const query = {
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(query);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("Failed to fetch user profile");
      }
    });

    it("should fail when profile not found", async () => {
      const unknownCuratorId = CuratorId.create("did:plc:unknown").unwrap();

      const query = {
        curatorId: unknownCuratorId.value,
      };

      const result = await useCase.execute(query);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("Failed to fetch user profile");
      }
    });
  });
});
