import { UseCase } from "../../../shared/application/UseCase";
import { Result } from "../../../shared/core/Result";
import { ICardRepository } from "../domain/ICardRepository";
import { LibraryService } from "../domain/LibraryService";
import { CardId } from "../domain/value-objects/CardId";
import { CollectionId } from "../domain/value-objects/CollectionId";
import { UniqueEntityID } from "../../../shared/domain/UniqueEntityID";

export interface AddCardToCollectionDTO {
  cardId: string;
  collectionId: string;
}

export class AddCardToCollectionUseCase implements UseCase<AddCardToCollectionDTO, Result<void>> {
  constructor(
    private cardRepository: ICardRepository,
    private libraryService: LibraryService
  ) {}

  async execute(request: AddCardToCollectionDTO): Promise<Result<void>> {
    try {
      const cardId = CardId.create(new UniqueEntityID(request.cardId)).unwrap();
      const collectionId = CollectionId.create(new UniqueEntityID(request.collectionId)).unwrap();

      // Check if card exists
      const cardResult = await this.cardRepository.findById(cardId);
      if (cardResult.isErr()) {
        return Result.fail(cardResult.error);
      }
      
      if (!cardResult.value) {
        return Result.fail("Card not found");
      }

      // Add card to collection
      return await this.libraryService.addCardToCollection(cardId, collectionId);
    } catch (error) {
      return Result.fail(`Error adding card to collection: ${error}`);
    }
  }
}
