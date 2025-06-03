import { err, Result } from "../../../shared/core/Result";
import { ICardRepository } from "../domain/ICardRepository";
import { LibraryService } from "../domain/LibraryService";
import { CardId } from "../domain/value-objects/CardId";
import { CollectionId } from "../domain/value-objects/CollectionId";
import { CuratorId } from "../../annotations/domain/value-objects/CuratorId";
import { UniqueEntityID } from "../../../shared/domain/UniqueEntityID";
import { UseCase } from "src/shared/core/UseCase";

export interface AddCardToCollectionDTO {
  cardId: string;
  collectionId: string;
  authorId: string;
}

export class AddCardToCollectionUseCase
  implements UseCase<AddCardToCollectionDTO, Result<void>>
{
  constructor(
    private cardRepository: ICardRepository,
    private libraryService: LibraryService
  ) {}

  async execute(request: AddCardToCollectionDTO): Promise<Result<void>> {
    try {
      const cardId = CardId.create(new UniqueEntityID(request.cardId)).unwrap();
      const collectionId = CollectionId.create(
        new UniqueEntityID(request.collectionId)
      ).unwrap();
      
      const authorIdResult = CuratorId.create(request.authorId);
      if (authorIdResult.isErr()) {
        return err(authorIdResult.error);
      }
      const authorId = authorIdResult.value;

      // Check if card exists
      const cardResult = await this.cardRepository.findById(cardId);
      if (cardResult.isErr()) {
        return err(cardResult.error);
      }

      if (!cardResult.value) {
        return err(new Error("Card not found"));
      }

      // Add card to collection
      return await this.libraryService.addCardToCollection(
        cardId,
        collectionId,
        authorId
      );
    } catch (error) {
      return err(new Error(`Error adding card to collection: ${error}`));
    }
  }
}
