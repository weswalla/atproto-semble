import { err, ok, Result } from "../../../shared/core/Result";
import { Card } from "../domain/Card";
import { ICardRepository } from "../domain/ICardRepository";
import { LibraryService } from "../domain/LibraryService";
import { CardType, CardTypeEnum } from "../domain/value-objects/CardType";
import { CardContent } from "../domain/value-objects/CardContent";
import { CuratorId } from "../../annotations/domain/value-objects/CuratorId";
import { CollectionId } from "../domain/value-objects/CollectionId";
import { UniqueEntityID } from "../../../shared/domain/UniqueEntityID";
import { UseCase } from "src/shared/core/UseCase";

export interface AddCardToLibraryDTO {
  curatorId: string;
  type: string;
  content: any;
  parentCardId?: string;
  collectionIds?: string[];
}

export class AddCardToLibraryUseCase
  implements UseCase<AddCardToLibraryDTO, Result<string>>
{
  constructor(
    private cardRepository: ICardRepository,
    private libraryService: LibraryService
  ) {}

  async execute(request: AddCardToLibraryDTO): Promise<Result<string>> {
    try {
      // Create CuratorId
      const curatorIdResult = CuratorId.create(request.curatorId);
      if (curatorIdResult.isErr()) {
        return err(curatorIdResult.error);
      }
      const curatorId = curatorIdResult.value;

      // Create CardType
      const cardTypeResult = CardType.create(request.type as CardTypeEnum);
      if (cardTypeResult.isErr()) {
        return err(cardTypeResult.error);
      }
      const cardType = cardTypeResult.value;

      // Create CardContent
      const cardContentResult = CardContent.create({
        type: cardType.value,
        data: request.content,
      });
      if (cardContentResult.isErr()) {
        return err(cardContentResult.error);
      }
      const cardContent = cardContentResult.value;

      // Create Card
      const cardResult = Card.create({
        curatorId,
        type: cardType,
        content: cardContent,
      });

      if (cardResult.isErr()) {
        return err(cardResult.error);
      }
      const card = cardResult.value;

      // Add card to library
      const saveResult = await this.libraryService.addCardToLibrary(card);
      if (saveResult.isErr()) {
        return err(saveResult.error);
      }

      // Add card to collections if specified
      if (request.collectionIds && request.collectionIds.length > 0) {
        for (const collectionIdStr of request.collectionIds) {
          const collectionId = CollectionId.create(
            new UniqueEntityID(collectionIdStr)
          ).unwrap();
          await this.libraryService.addCardToCollection(
            card.cardId,
            collectionId,
            curatorId
          );
        }
      }

      return ok(card.cardId.getStringValue());
    } catch (error) {
      return err(new Error(`Error adding card to library: ${error}`));
    }
  }
}
