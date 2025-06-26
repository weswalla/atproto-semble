import { DeleteCollectionUseCase } from "../../application/useCases/commands/DeleteCollectionUseCase";
import { InMemoryCollectionRepository } from "../utils/InMemoryCollectionRepository";
import { FakeCollectionPublisher } from "../utils/FakeCollectionPublisher";
import { CuratorId } from "../../../annotations/domain/value-objects/CuratorId";
import { CollectionBuilder } from "../utils/builders/CollectionBuilder";

describe("DeleteCollectionUseCase", () => {
  let useCase: DeleteCollectionUseCase;
  let collectionRepository: InMemoryCollectionRepository;
  let collectionPublisher: FakeCollectionPublisher;
  let curatorId: CuratorId;
  let otherCuratorId: CuratorId;

  beforeEach(() => {
    collectionRepository = new InMemoryCollectionRepository();
    collectionPublisher = new FakeCollectionPublisher();
    useCase = new DeleteCollectionUseCase(collectionRepository, collectionPublisher);
    
    curatorId = CuratorId.create("did:plc:testcurator").unwrap();
    otherCuratorId = CuratorId.create("did:plc:othercurator").unwrap();
  });

  afterEach(() => {
    collectionRepository.clear();
    collectionPublisher.clear();
  });

  const createCollection = async (authorId: CuratorId, name: string, published: boolean = true) => {
    const collection = new CollectionBuilder()
      .withAuthorId(authorId.value)
      .withName(name)
      .withPublished(published)
      .build();

    if (collection instanceof Error) {
      throw new Error(`Failed to create collection: ${collection.message}`);
    }

    await collectionRepository.save(collection);
    return collection;
  };

  describe("Basic collection deletion", () => {
    it("should successfully delete a published collection", async () => {
      const collection = await createCollection(curatorId, "Collection to Delete", true);

      const request = {
        collectionId: collection.collectionId.getStringValue(),
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);
      const response = result.unwrap();
      expect(response.collectionId).toBe(collection.collectionId.getStringValue());

      // Verify collection was deleted from repository
      const deletedCollectionResult = await collectionRepository.findById(collection.collectionId);
      expect(deletedCollectionResult.unwrap()).toBeNull();

      // Verify collection was unpublished
      const unpublishedCollections = collectionPublisher.getUnpublishedCollections();
      expect(unpublishedCollections).toHaveLength(1);
      expect(unpublishedCollections[0]?.uri).toBe(collection.publishedRecordId?.uri);
    });

    it("should successfully delete an unpublished collection", async () => {
      const collection = await createCollection(curatorId, "Unpublished Collection", false);

      const request = {
        collectionId: collection.collectionId.getStringValue(),
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);

      // Verify collection was deleted from repository
      const deletedCollectionResult = await collectionRepository.findById(collection.collectionId);
      expect(deletedCollectionResult.unwrap()).toBeNull();

      // Verify no unpublish operation was performed
      const unpublishedCollections = collectionPublisher.getUnpublishedCollections();
      expect(unpublishedCollections).toHaveLength(0);
    });

    it("should delete collection without affecting other collections", async () => {
      const collection1 = await createCollection(curatorId, "Collection 1");
      const collection2 = await createCollection(curatorId, "Collection 2");

      const request = {
        collectionId: collection1.collectionId.getStringValue(),
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);

      // Verify only the specified collection was deleted
      const remainingCollections = collectionRepository.getAllCollections();
      expect(remainingCollections).toHaveLength(1);
      expect(remainingCollections[0]!.collectionId.getStringValue()).toBe(
        collection2.collectionId.getStringValue()
      );
    });
  });

  describe("Authorization", () => {
    it("should fail when trying to delete another user's collection", async () => {
      const collection = await createCollection(curatorId, "Someone Else's Collection");

      const request = {
        collectionId: collection.collectionId.getStringValue(),
        curatorId: otherCuratorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain("Only the collection author can delete the collection");

      // Verify collection was not deleted
      const existingCollectionResult = await collectionRepository.findById(collection.collectionId);
      expect(existingCollectionResult.unwrap()).not.toBeNull();
    });

    it("should allow author to delete their own collection", async () => {
      const collection = await createCollection(curatorId, "My Collection");

      const request = {
        collectionId: collection.collectionId.getStringValue(),
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);

      // Verify collection was deleted
      const deletedCollectionResult = await collectionRepository.findById(collection.collectionId);
      expect(deletedCollectionResult.unwrap()).toBeNull();
    });
  });

  describe("Validation", () => {
    it("should fail with invalid collection ID", async () => {
      const request = {
        collectionId: "invalid-collection-id",
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain("Collection not found");
    });

    it("should fail with invalid curator ID", async () => {
      const collection = await createCollection(curatorId, "Test Collection");

      const request = {
        collectionId: collection.collectionId.getStringValue(),
        curatorId: "invalid-curator-id",
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain("Invalid curator ID");
    });

    it("should fail when collection does not exist", async () => {
      const request = {
        collectionId: "non-existent-collection-id",
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain("Collection not found");
    });
  });

  describe("Publishing integration", () => {
    it("should unpublish collection before deletion", async () => {
      const collection = await createCollection(curatorId, "Published Collection", true);
      const initialUnpublishCount = collectionPublisher.getUnpublishedCollections().length;

      const request = {
        collectionId: collection.collectionId.getStringValue(),
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);

      // Verify unpublish operation occurred
      const finalUnpublishCount = collectionPublisher.getUnpublishedCollections().length;
      expect(finalUnpublishCount).toBe(initialUnpublishCount + 1);

      // Verify the correct collection was unpublished
      const unpublishedCollections = collectionPublisher.getUnpublishedCollections();
      const unpublishedCollection = unpublishedCollections.find(
        uc => uc.uri === collection.publishedRecordId?.uri
      );
      expect(unpublishedCollection).toBeDefined();
    });

    it("should handle unpublish failure gracefully", async () => {
      const collection = await createCollection(curatorId, "Collection with Unpublish Failure", true);
      
      // Configure publisher to fail unpublish
      collectionPublisher.setShouldFailUnpublish(true);

      const request = {
        collectionId: collection.collectionId.getStringValue(),
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain("Failed to unpublish collection");

      // Verify collection was not deleted if unpublish failed
      const existingCollectionResult = await collectionRepository.findById(collection.collectionId);
      expect(existingCollectionResult.unwrap()).not.toBeNull();
    });

    it("should not attempt to unpublish if collection was never published", async () => {
      const collection = await createCollection(curatorId, "Never Published Collection", false);
      const initialUnpublishCount = collectionPublisher.getUnpublishedCollections().length;

      const request = {
        collectionId: collection.collectionId.getStringValue(),
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);

      // Verify no unpublish operation occurred
      const finalUnpublishCount = collectionPublisher.getUnpublishedCollections().length;
      expect(finalUnpublishCount).toBe(initialUnpublishCount);

      // Verify collection was still deleted
      const deletedCollectionResult = await collectionRepository.findById(collection.collectionId);
      expect(deletedCollectionResult.unwrap()).toBeNull();
    });
  });

  describe("Edge cases", () => {
    it("should handle deletion of collection with no published record ID", async () => {
      const collection = new CollectionBuilder()
        .withAuthorId(curatorId.value)
        .withName("Collection Without Published Record")
        .withPublished(true)
        .build();

      if (collection instanceof Error) {
        throw new Error(`Failed to create collection: ${collection.message}`);
      }

      // Manually clear the published record ID to simulate edge case
      (collection as any).props.publishedRecordId = undefined;
      await collectionRepository.save(collection);

      const request = {
        collectionId: collection.collectionId.getStringValue(),
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);

      // Verify collection was deleted despite missing published record ID
      const deletedCollectionResult = await collectionRepository.findById(collection.collectionId);
      expect(deletedCollectionResult.unwrap()).toBeNull();
    });

    it("should handle multiple deletion attempts on same collection", async () => {
      const collection = await createCollection(curatorId, "Collection to Delete Twice");

      const request = {
        collectionId: collection.collectionId.getStringValue(),
        curatorId: curatorId.value,
      };

      // First deletion should succeed
      const firstResult = await useCase.execute(request);
      expect(firstResult.isOk()).toBe(true);

      // Second deletion should fail
      const secondResult = await useCase.execute(request);
      expect(secondResult.isErr()).toBe(true);
      expect(secondResult.error.message).toContain("Collection not found");
    });

    it("should handle repository deletion failure", async () => {
      const collection = await createCollection(curatorId, "Collection with Repo Failure");
      
      // Configure repository to fail deletion
      collectionRepository.setShouldFailDelete(true);

      const request = {
        collectionId: collection.collectionId.getStringValue(),
        curatorId: curatorId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);

      // Verify collection still exists if repository deletion failed
      const existingCollectionResult = await collectionRepository.findById(collection.collectionId);
      expect(existingCollectionResult.unwrap()).not.toBeNull();
    });
  });
});
