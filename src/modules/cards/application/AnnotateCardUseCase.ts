import { err, ok, Result } from "../../../shared/core/Result";
import { Card } from "../domain/Card";
import { ICardRepository } from "../domain/ICardRepository";
import { LibraryService } from "../domain/LibraryService";
import { CardType, CardTypeEnum } from "../domain/value-objects/CardType";
import { CardContent } from "../domain/value-objects/CardContent";
import { CardId } from "../domain/value-objects/CardId";
import { CuratorId } from "../../annotations/domain/value-objects/CuratorId";
import { UniqueEntityID } from "../../../shared/domain/UniqueEntityID";
import { UseCase } from "src/shared/core/UseCase";

export interface AnnotateCardDTO {
  curatorId: string;
  parentCardId: string;
  annotationType: string; // 'NOTE', 'HIGHLIGHT', or 'SCREENSHOT'
  content: any;
}

export class AnnotateCardUseCase
  implements UseCase<AnnotateCardDTO, Result<string>>
{
  constructor(
    private cardRepository: ICardRepository,
    private libraryService: LibraryService
  ) {}

  async execute(request: AnnotateCardDTO): Promise<Result<string>> {
    try {
      // Create CuratorId
      const curatorIdResult = CuratorId.create(request.curatorId);
      if (curatorIdResult.isErr()) {
        return err(curatorIdResult.error);
      }
      const curatorId = curatorIdResult.value;

      // Validate parent card exists
      const parentCardId = CardId.create(
        new UniqueEntityID(request.parentCardId)
      ).unwrap();
      const parentCardResult = await this.cardRepository.findById(parentCardId);

      if (parentCardResult.isErr()) {
        return err(parentCardResult.error);
      }

      if (!parentCardResult.value) {
        return err(new Error("Parent card not found"));
      }

      // Create CardType
      let annotationType: CardTypeEnum;
      switch (request.annotationType.toUpperCase()) {
        case "NOTE":
          annotationType = CardTypeEnum.NOTE;
          break;
        case "HIGHLIGHT":
          annotationType = CardTypeEnum.HIGHLIGHT;
          break;
        case "SCREENSHOT":
          annotationType = CardTypeEnum.SCREENSHOT;
          break;
        default:
          return err(
            new Error(`Invalid annotation type: ${request.annotationType}`)
          );
      }

      const cardTypeResult = CardType.create(annotationType);
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

      // Create annotation Card
      const cardResult = Card.create({
        curatorId,
        type: cardType,
        content: cardContent,
        parentCardId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (cardResult.isErr()) {
        return err(cardResult.error);
      }
      const card = cardResult.value;

      // Save annotation card
      const saveResult = await this.libraryService.addCardToLibrary(card);
      if (saveResult.isErr()) {
        return err(saveResult.error);
      }

      return ok(card.cardId.getStringValue());
    } catch (error) {
      return err(new Error(`Error annotating card: ${error}`));
    }
  }
}
