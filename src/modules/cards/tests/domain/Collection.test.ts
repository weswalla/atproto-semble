import {
  Collection,
  CollectionAccessType,
  CollectionAccessError,
  CollectionValidationError,
} from "../../domain/Collection";
import { CuratorId } from "../../../annotations/domain/value-objects/CuratorId";
import { CardId } from "../../domain/value-objects/CardId";
import { UniqueEntityID } from "../../../../shared/domain/UniqueEntityID";
import { Err } from "src/shared/core/Result";

describe("Collection", () => {
  let authorId: CuratorId;
  let collaboratorId: CuratorId;
  let otherUserId: CuratorId;
  let cardId: CardId;

  beforeEach(() => {
    authorId = CuratorId.create("did:plc:author").unwrap();
    collaboratorId = CuratorId.create("did:plc:collaborator").unwrap();
    otherUserId = CuratorId.create("did:plc:other").unwrap();
    cardId = CardId.create(new UniqueEntityID()).unwrap();
  });

  describe("create", () => {
    it("should create a collection with valid props", () => {
      const result = Collection.create({
        authorId,
        name: "Test Collection",
        description: "A test collection",
        accessType: CollectionAccessType.OPEN,
        collaboratorIds: [],
        cardIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(result.isOk()).toBe(true);
      const collection = result.unwrap();
      expect(collection.name.value).toBe("Test Collection");
      expect(collection.description?.value).toBe("A test collection");
      expect(collection.authorId).toBe(authorId);
      expect(collection.accessType).toBe(CollectionAccessType.OPEN);
      expect(collection.isOpen).toBe(true);
      expect(collection.isClosed).toBe(false);
    });

    it("should fail to create collection with empty name", () => {
      const result = Collection.create({
        authorId,
        name: "",
        accessType: CollectionAccessType.OPEN,
        collaboratorIds: [],
        cardIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(result.isErr()).toBe(true);
      expect(result.error).toBeInstanceOf(CollectionValidationError);
      expect(result.error.message).toContain("Collection name cannot be empty");
    });

    it("should fail to create collection with name too long", () => {
      const longName = "a".repeat(101);
      const result = Collection.create({
        authorId,
        name: longName,
        accessType: CollectionAccessType.OPEN,
        collaboratorIds: [],
        cardIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(result.isErr()).toBe(true);
      expect(result.error).toBeInstanceOf(CollectionValidationError);
      expect(result.error.message).toContain(
        "Collection name cannot exceed 100 characters"
      );
    });

    it("should fail to create collection with description too long", () => {
      const longDescription = "a".repeat(501);
      const result = Collection.create({
        authorId,
        name: "Valid Name",
        description: longDescription,
        accessType: CollectionAccessType.OPEN,
        collaboratorIds: [],
        cardIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(result.isErr()).toBe(true);
      expect(result.error).toBeInstanceOf(CollectionValidationError);
      expect(result.error.message).toContain(
        "Collection description cannot exceed 500 characters"
      );
    });

    it("should fail to create collection with invalid access type", () => {
      const result = Collection.create({
        authorId,
        name: "Valid Name",
        accessType: "INVALID" as CollectionAccessType,
        collaboratorIds: [],
        cardIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(result.isErr()).toBe(true);
      expect(result.error).toBeInstanceOf(CollectionValidationError);
      expect(result.error.message).toContain("Invalid access type");
    });
  });

  describe("access control", () => {
    let openCollection: Collection;
    let closedCollection: Collection;

    beforeEach(() => {
      openCollection = Collection.create({
        authorId,
        name: "Open Collection",
        accessType: CollectionAccessType.OPEN,
        collaboratorIds: [collaboratorId],
        cardIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }).unwrap();

      closedCollection = Collection.create({
        authorId,
        name: "Closed Collection",
        accessType: CollectionAccessType.CLOSED,
        collaboratorIds: [collaboratorId],
        cardIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }).unwrap();
    });

    describe("canAddCard", () => {
      it("should allow author to add cards to any collection", () => {
        expect(openCollection.canAddCard(authorId)).toBe(true);
        expect(closedCollection.canAddCard(authorId)).toBe(true);
      });

      it("should allow anyone to add cards to open collection", () => {
        expect(openCollection.canAddCard(otherUserId)).toBe(true);
        expect(openCollection.canAddCard(collaboratorId)).toBe(true);
      });

      it("should only allow collaborators and author to add cards to closed collection", () => {
        expect(closedCollection.canAddCard(collaboratorId)).toBe(true);
        expect(closedCollection.canAddCard(otherUserId)).toBe(false);
      });
    });

    describe("addCard", () => {
      it("should allow authorized users to add cards", () => {
        const result = openCollection.addCard(cardId, otherUserId);
        expect(result.isOk()).toBe(true);
        expect(openCollection.cardIds).toContain(cardId);
      });

      it("should prevent unauthorized users from adding cards to closed collection", () => {
        const result = closedCollection.addCard(cardId, otherUserId);
        expect(result.isErr()).toBe(true);
        expect(
          (result as Err<undefined, CollectionAccessError>).error
        ).toBeInstanceOf(CollectionAccessError);
        expect(closedCollection.cardIds).not.toContain(cardId);
      });

      it("should not add duplicate cards", () => {
        openCollection.addCard(cardId, authorId);
        const result = openCollection.addCard(cardId, authorId);
        expect(result.isOk()).toBe(true);
        expect(
          openCollection.cardIds.filter((id) => id.equals(cardId))
        ).toHaveLength(1);
      });
    });

    describe("removeCard", () => {
      beforeEach(() => {
        openCollection.addCard(cardId, authorId);
        closedCollection.addCard(cardId, authorId);
      });

      it("should allow authorized users to remove cards", () => {
        const result = openCollection.removeCard(cardId, otherUserId);
        expect(result.isOk()).toBe(true);
        expect(openCollection.cardIds).not.toContain(cardId);
      });

      it("should prevent unauthorized users from removing cards from closed collection", () => {
        const result = closedCollection.removeCard(cardId, otherUserId);
        expect(result.isErr()).toBe(true);
        expect(
          (result as Err<undefined, CollectionAccessError>).error
        ).toBeInstanceOf(CollectionAccessError);
        expect(closedCollection.cardIds).toContain(cardId);
      });
    });
  });

  describe("collaborator management", () => {
    let collection: Collection;

    beforeEach(() => {
      collection = Collection.create({
        authorId,
        name: "Test Collection",
        accessType: CollectionAccessType.CLOSED,
        collaboratorIds: [],
        cardIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }).unwrap();
    });

    describe("addCollaborator", () => {
      it("should allow author to add collaborators", () => {
        const result = collection.addCollaborator(collaboratorId, authorId);
        expect(result.isOk()).toBe(true);
        expect(collection.collaboratorIds).toContain(collaboratorId);
      });

      it("should prevent non-authors from adding collaborators", () => {
        const result = collection.addCollaborator(collaboratorId, otherUserId);
        expect(result.isErr()).toBe(true);
        expect(
          (result as Err<undefined, CollectionAccessError>).error
        ).toBeInstanceOf(CollectionAccessError);
        expect(collection.collaboratorIds).not.toContain(collaboratorId);
      });

      it("should not add duplicate collaborators", () => {
        collection.addCollaborator(collaboratorId, authorId);
        const result = collection.addCollaborator(collaboratorId, authorId);
        expect(result.isOk()).toBe(true);
        expect(
          collection.collaboratorIds.filter((id) => id.equals(collaboratorId))
        ).toHaveLength(1);
      });
    });

    describe("removeCollaborator", () => {
      beforeEach(() => {
        collection.addCollaborator(collaboratorId, authorId);
      });

      it("should allow author to remove collaborators", () => {
        const result = collection.removeCollaborator(collaboratorId, authorId);
        expect(result.isOk()).toBe(true);
        expect(collection.collaboratorIds).not.toContain(collaboratorId);
      });

      it("should prevent non-authors from removing collaborators", () => {
        const result = collection.removeCollaborator(
          collaboratorId,
          otherUserId
        );
        expect(result.isErr()).toBe(true);
        expect(
          (result as Err<undefined, CollectionAccessError>).error
        ).toBeInstanceOf(CollectionAccessError);
        expect(collection.collaboratorIds).toContain(collaboratorId);
      });
    });
  });

  describe("access type management", () => {
    let collection: Collection;

    beforeEach(() => {
      collection = Collection.create({
        authorId,
        name: "Test Collection",
        accessType: CollectionAccessType.OPEN,
        collaboratorIds: [],
        cardIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }).unwrap();
    });

    it("should allow author to change access type", () => {
      const result = collection.changeAccessType(
        CollectionAccessType.CLOSED,
        authorId
      );
      expect(result.isOk()).toBe(true);
      expect(collection.accessType).toBe(CollectionAccessType.CLOSED);
      expect(collection.isClosed).toBe(true);
      expect(collection.isOpen).toBe(false);
    });

    it("should prevent non-authors from changing access type", () => {
      const result = collection.changeAccessType(
        CollectionAccessType.CLOSED,
        otherUserId
      );
      expect(result.isErr()).toBe(true);
      expect(
        (result as Err<undefined, CollectionAccessError>).error
      ).toBeInstanceOf(CollectionAccessError);
      expect(collection.accessType).toBe(CollectionAccessType.OPEN);
    });
  });

  describe("getters", () => {
    let collection: Collection;

    beforeEach(() => {
      collection = Collection.create({
        authorId,
        name: "Test Collection",
        description: "Test description",
        accessType: CollectionAccessType.CLOSED,
        collaboratorIds: [collaboratorId],
        cardIds: [cardId],
        createdAt: new Date(),
        updatedAt: new Date(),
      }).unwrap();
    });

    it("should return defensive copies of arrays", () => {
      const collaborators = collection.collaboratorIds;
      const cards = collection.cardIds;

      collaborators.push(otherUserId);
      cards.push(CardId.create(new UniqueEntityID()).unwrap());

      expect(collection.collaboratorIds).toHaveLength(1);
      expect(collection.cardIds).toHaveLength(1);
    });
  });
});
