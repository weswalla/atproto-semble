import { err, Result } from "../../../shared/core/Result";
import { ICardRepository } from "./ICardRepository";
import { ICollectionRepository } from "./ICollectionRepository";
import { Card } from "./Card";
import { CardId } from "./value-objects/CardId";
import { CollectionId } from "./value-objects/CollectionId";
import { CuratorId } from "./value-objects/CuratorId";

export class LibraryService {
  constructor(
    private cardRepository: ICardRepository,
    private collectionRepository: ICollectionRepository
  ) {}

  async addCardToLibrary(card: Card): Promise<Result<void>> {
    return await this.cardRepository.save(card);
  }

  async addCardToCollection(
    cardId: CardId,
    collectionId: CollectionId,
    authorId: CuratorId
  ): Promise<Result<void>> {
    const collectionResult =
      await this.collectionRepository.findById(collectionId);

    if (collectionResult.isErr()) {
      return err(collectionResult.error);
    }

    const collection = collectionResult.value;

    if (!collection) {
      return err(new Error("Collection not found"));
    }

    const addResult = collection.addCard(cardId, authorId);

    if (addResult.isErr()) {
      return err(addResult.error);
    }

    return await this.collectionRepository.save(collection);
  }
}
