import {
  AddCardToCollectionDTO,
  AddCardToCollectionUseCase,
  ValidationError,
  CardNotFoundError,
  CollectionNotFoundError,
} from "../../application/AddCardToCollectionUseCase";
import { InMemoryCardRepository } from "../utils/InMemoryCardRepository";
import { InMemoryCollectionRepository } from "../utils/InMemoryCollectionRepository";
import { FakeCollectionPublisher } from "../utils/FakeCollectionPublisher";
import { Card } from "../../domain/Card";
import { Collection, CollectionAccessType } from "../../domain/Collection";
import { CardTypeEnum } from "../../domain/value-objects/CardType";
import { CuratorId } from "../../../annotations/domain/value-objects/CuratorId";
import { CardFactory } from "../../domain/CardFactory";

describe("AddCardToCollectionUseCase", () => {
  let cardRepository: InMemoryCardRepository;
  let collectionRepository: InMemoryCollectionRepository;
  let collectionPublisher: FakeCollectionPublisher;
  let useCase: AddCardToCollectionUseCase;
  let curatorId: CuratorId;
  let otherUserId: CuratorId;

  beforeEach(() => {
    cardRepository = new InMemoryCardRepository();
    collectionRepository = new InMemoryCollectionRepository();
    collectionPublisher = new FakeCollectionPublisher();
    useCase = new AddCardToCollectionUseCase(
      cardRepository,
      collectionRepository,
      collectionPublisher
    );

    const curatorIdResult = CuratorId.create("did:plc:curator123");
    expect(curatorIdResult.isOk()).toBe(true);
    curatorId = curatorIdResult.unwrap();

    const otherUserIdResult = CuratorId.create("did:plc:otheruser456");
    expect(otherUserIdResult.isOk()).toBe(true);
    otherUserId = otherUserIdResult.unwrap();
  });

  afterEach(() => {
    cardRepository.clear();
    collectionRepository.clear();
    collectionPublisher.clear();
  });

  describe("Successful card addition", () => {
    it("should add an existing card to an open collection", async () => {
      // Arrange - Create a card
      const cardResult = CardFactory.create({
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.NOTE,
          text: "Test note for collection",
          title: "Test Note",
        },
      });
      expect(cardResult.isOk()).toBe(true);
      const card = cardResult.unwrap();
      await cardRepository.save(card);

      // Create an open collection
      const collectionResult = Collection.create({
        authorId: curatorId,
        name: "Test Collection",
        accessType: CollectionAccessType.OPEN,
        collaboratorIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(collectionResult.isOk()).toBe(true);
      const collection = collectionResult.unwrap();
      await collectionRepository.save(collection);

      const dto: AddCardToCollectionDTO = {
        cardId: card.cardId.getStringValue(),
        collectionId: collection.collectionId.getStringValue(),
        userId: curatorId.value,
      };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const response = result.value;
        expect(response.cardId).toBe(card.cardId.getStringValue());
        expect(response.collectionId).toBe(collection.collectionId.getStringValue());
        expect(response.collectionRecord).toBeDefined();
        expect(response.publishedLinks).toHaveLength(1);
        expect(response.publishedLinks[0]?.cardId).toBe(card.cardId.getStringValue());

        // Verify collection was updated and published
        const updatedCollectionResult = await collectionRepository.findById(
          collection.collectionId
        );
        expect(updatedCollectionResult.isOk()).toBe(true);
        const updatedCollection = updatedCollectionResult.unwrap();
        expect(updatedCollection?.cardIds).toHaveLength(1);
        expect(updatedCollection?.cardIds[0]?.getStringValue()).toBe(
          card.cardId.getStringValue()
        );
        expect(updatedCollection?.isPublished).toBe(true);

        // Verify the card link was marked as published
        const cardLinks = updatedCollection?.cardLinks || [];
        expect(cardLinks).toHaveLength(1);
        expect(cardLinks[0]?.publishedRecordId).toBeDefined();
        expect(cardLinks[0]?.addedBy.equals(curatorId)).toBe(true);
      }
    });

    it("should add card to collection by collection author", async () => {
      // Arrange - Create a card
      const cardResult = CardFactory.create({
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.NOTE,
          text: "Test note",
        },
      });
      expect(cardResult.isOk()).toBe(true);
      const card = cardResult.unwrap();
      await cardRepository.save(card);

      // Create a closed collection (only author can add)
      const collectionResult = Collection.create({
        authorId: curatorId,
        name: "Private Collection",
        accessType: CollectionAccessType.CLOSED,
        collaboratorIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(collectionResult.isOk()).toBe(true);
      const collection = collectionResult.unwrap();
      await collectionRepository.save(collection);

      const dto: AddCardToCollectionDTO = {
        cardId: card.cardId.getStringValue(),
        collectionId: collection.collectionId.getStringValue(),
        userId: curatorId.value, // Author adding to their own collection
      };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const response = result.value;
        expect(response.publishedLinks).toHaveLength(1);
      }
    });

    it("should return existing link when card is already in collection", async () => {
      // Arrange - Create a card and collection
      const cardResult = CardFactory.create({
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.NOTE,
          text: "Test note",
        },
      });
      expect(cardResult.isOk()).toBe(true);
      const card = cardResult.unwrap();
      await cardRepository.save(card);

      const collectionResult = Collection.create({
        authorId: curatorId,
        name: "Test Collection",
        accessType: CollectionAccessType.OPEN,
        collaboratorIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(collectionResult.isOk()).toBe(true);
      const collection = collectionResult.unwrap();

      // Add card to collection first time
      collection.addCard(card.cardId, curatorId);
      await collectionRepository.save(collection);

      const dto: AddCardToCollectionDTO = {
        cardId: card.cardId.getStringValue(),
        collectionId: collection.collectionId.getStringValue(),
        userId: curatorId.value,
      };

      // Act - Try to add the same card again
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const response = result.value;
        expect(response.publishedLinks).toHaveLength(0); // No new links published
        
        // Verify collection still has only one card
        const updatedCollectionResult = await collectionRepository.findById(
          collection.collectionId
        );
        expect(updatedCollectionResult.isOk()).toBe(true);
        const updatedCollection = updatedCollectionResult.unwrap();
        expect(updatedCollection?.cardIds).toHaveLength(1);
      }
    });
  });

  describe("Permission handling", () => {
    it("should allow non-author to add card to open collection", async () => {
      // Arrange - Create a card by other user
      const cardResult = CardFactory.create({
        curatorId: otherUserId.value,
        cardInput: {
          type: CardTypeEnum.NOTE,
          text: "Test note by other user",
        },
      });
      expect(cardResult.isOk()).toBe(true);
      const card = cardResult.unwrap();
      await cardRepository.save(card);

      // Create an open collection by curator
      const collectionResult = Collection.create({
        authorId: curatorId,
        name: "Open Collection",
        accessType: CollectionAccessType.OPEN,
        collaboratorIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(collectionResult.isOk()).toBe(true);
      const collection = collectionResult.unwrap();
      await collectionRepository.save(collection);

      const dto: AddCardToCollectionDTO = {
        cardId: card.cardId.getStringValue(),
        collectionId: collection.collectionId.getStringValue(),
        userId: otherUserId.value, // Non-author adding to open collection
      };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should reject non-author adding card to closed collection", async () => {
      // Arrange - Create a card
      const cardResult = CardFactory.create({
        curatorId: otherUserId.value,
        cardInput: {
          type: CardTypeEnum.NOTE,
          text: "Test note",
        },
      });
      expect(cardResult.isOk()).toBe(true);
      const card = cardResult.unwrap();
      await cardRepository.save(card);

      // Create a closed collection
      const collectionResult = Collection.create({
        authorId: curatorId,
        name: "Private Collection",
        accessType: CollectionAccessType.CLOSED,
        collaboratorIds: [], // Other user is not a collaborator
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(collectionResult.isOk()).toBe(true);
      const collection = collectionResult.unwrap();
      await collectionRepository.save(collection);

      const dto: AddCardToCollectionDTO = {
        cardId: card.cardId.getStringValue(),
        collectionId: collection.collectionId.getStringValue(),
        userId: otherUserId.value, // Non-author, non-collaborator
      };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("permission");
      }
    });

    it("should allow collaborator to add card to closed collection", async () => {
      // Arrange - Create a card
      const cardResult = CardFactory.create({
        curatorId: otherUserId.value,
        cardInput: {
          type: CardTypeEnum.NOTE,
          text: "Test note",
        },
      });
      expect(cardResult.isOk()).toBe(true);
      const card = cardResult.unwrap();
      await cardRepository.save(card);

      // Create a closed collection with other user as collaborator
      const collectionResult = Collection.create({
        authorId: curatorId,
        name: "Private Collection",
        accessType: CollectionAccessType.CLOSED,
        collaboratorIds: [otherUserId], // Other user is a collaborator
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(collectionResult.isOk()).toBe(true);
      const collection = collectionResult.unwrap();
      await collectionRepository.save(collection);

      const dto: AddCardToCollectionDTO = {
        cardId: card.cardId.getStringValue(),
        collectionId: collection.collectionId.getStringValue(),
        userId: otherUserId.value, // Collaborator
      };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isOk()).toBe(true);
    });
  });

  describe("Error handling", () => {
    it("should fail when card does not exist", async () => {
      // Arrange - Create a collection but no card
      const collectionResult = Collection.create({
        authorId: curatorId,
        name: "Test Collection",
        accessType: CollectionAccessType.OPEN,
        collaboratorIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(collectionResult.isOk()).toBe(true);
      const collection = collectionResult.unwrap();
      await collectionRepository.save(collection);

      const dto: AddCardToCollectionDTO = {
        cardId: "non-existent-card-id",
        collectionId: collection.collectionId.getStringValue(),
        userId: curatorId.value,
      };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(CardNotFoundError);
        expect(result.error.message).toContain("Card not found");
      }
    });

    it("should fail when collection does not exist", async () => {
      // Arrange - Create a card but no collection
      const cardResult = CardFactory.create({
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.NOTE,
          text: "Test note",
        },
      });
      expect(cardResult.isOk()).toBe(true);
      const card = cardResult.unwrap();
      await cardRepository.save(card);

      const dto: AddCardToCollectionDTO = {
        cardId: card.cardId.getStringValue(),
        collectionId: "non-existent-collection-id",
        userId: curatorId.value,
      };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(CollectionNotFoundError);
        expect(result.error.message).toContain("Collection not found");
      }
    });

    it("should fail with invalid user ID", async () => {
      // Arrange - Create card and collection
      const cardResult = CardFactory.create({
        curatorId: curatorId.value,
        cardInput: {
          type: CardTypeEnum.NOTE,
          text: "Test note",
        },
      });
      expect(cardResult.isOk()).toBe(true);
      const card = cardResult.unwrap();
      await cardRepository.save(card);

      const collectionResult = Collection.create({
        authorId: curatorId,
        name: "Test Collection",
        accessType: CollectionAccessType.OPEN,
        collaboratorIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(collectionResult.isOk()).toBe(true);
      const collection = collectionResult.unwrap();
      await collectionRepository.save(collection);

      const dto: AddCardToCollectionDTO = {
        cardId: card.cardId.getStringValue(),
        collectionId: collection.collectionId.getStringValue(),
        userId: "invalid-user-id",
      };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("Invalid user ID");
      }
    });
  });
});
