import { UseCase } from "../../../shared/application/UseCase";
import { Result } from "../../../shared/core/Result";
import { Card } from "../domain/Card";
import { ICardRepository } from "../domain/ICardRepository";
import { LibraryService } from "../domain/LibraryService";
import { CardType, CardTypeEnum } from "../domain/value-objects/CardType";
import { CardContent } from "../domain/value-objects/CardContent";
import { CuratorId } from "../../annotations/domain/value-objects/CuratorId";
import { CollectionId } from "../domain/value-objects/CollectionId";
import { UniqueEntityID } from "../../../shared/domain/UniqueEntityID";

export interface AddCardToLibraryDTO {
  curatorId: string;
  type: string;
  content: any;
  parentCardId?: string;
  collectionIds?: string[];
}

export class AddCardToLibraryUseCase implements UseCase<AddCardToLibraryDTO, Result<string>> {
  constructor(
    private cardRepository: ICardRepository,
    private libraryService: LibraryService
  ) {}

  async execute(request: AddCardToLibraryDTO): Promise<Result<string>> {
    try {
      // Create CuratorId
      const curatorIdResult = CuratorId.create(request.curatorId);
      if (curatorIdResult.isErr()) {
        return Result.fail<string>(curatorIdResult.error);
      }
      const curatorId = curatorIdResult.value;

      // Create CardType
      const cardTypeResult = CardType.create(request.type as CardTypeEnum);
      if (cardTypeResult.isErr()) {
        return Result.fail<string>(cardTypeResult.error);
      }
      const cardType = cardTypeResult.value;

      // Create CardContent
      const cardContentResult = CardContent.create({
        type: cardType.value,
        data: request.content
      });
      if (cardContentResult.isErr()) {
        return Result.fail<string>(cardContentResult.error);
      }
      const cardContent = cardContentResult.value;

      // Create Card
      const cardResult = Card.create({
        curatorId,
        type: cardType,
        content: cardContent,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      if (cardResult.isErr()) {
        return Result.fail<string>(cardResult.error);
      }
      const card = cardResult.value;

      // Add card to library
      const saveResult = await this.libraryService.addCardToLibrary(card);
      if (saveResult.isErr()) {
        return Result.fail<string>(saveResult.error);
      }

      // Add card to collections if specified
      if (request.collectionIds && request.collectionIds.length > 0) {
        for (const collectionIdStr of request.collectionIds) {
          const collectionId = CollectionId.create(new UniqueEntityID(collectionIdStr)).unwrap();
          await this.libraryService.addCardToCollection(card.cardId, collectionId);
        }
      }

      return Result.ok<string>(card.cardId.getStringValue());
    } catch (error) {
      return Result.fail<string>(`Error adding card to library: ${error}`);
    }
  }
}
