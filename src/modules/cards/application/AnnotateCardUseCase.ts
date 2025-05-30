import { UseCase } from "../../../shared/application/UseCase";
import { Result } from "../../../shared/core/Result";
import { Card } from "../domain/Card";
import { ICardRepository } from "../domain/ICardRepository";
import { LibraryService } from "../domain/LibraryService";
import { CardType, CardTypeEnum } from "../domain/value-objects/CardType";
import { CardContent } from "../domain/value-objects/CardContent";
import { CardId } from "../domain/value-objects/CardId";
import { CuratorId } from "../../annotations/domain/value-objects/CuratorId";
import { UniqueEntityID } from "../../../shared/domain/UniqueEntityID";

export interface AnnotateCardDTO {
  curatorId: string;
  parentCardId: string;
  annotationType: string; // 'NOTE', 'HIGHLIGHT', or 'SCREENSHOT'
  content: any;
}

export class AnnotateCardUseCase implements UseCase<AnnotateCardDTO, Result<string>> {
  constructor(
    private cardRepository: ICardRepository,
    private libraryService: LibraryService
  ) {}

  async execute(request: AnnotateCardDTO): Promise<Result<string>> {
    try {
      // Create CuratorId
      const curatorIdResult = CuratorId.create(request.curatorId);
      if (curatorIdResult.isErr()) {
        return Result.fail<string>(curatorIdResult.error);
      }
      const curatorId = curatorIdResult.value;

      // Validate parent card exists
      const parentCardId = CardId.create(new UniqueEntityID(request.parentCardId)).unwrap();
      const parentCardResult = await this.cardRepository.findById(parentCardId);
      
      if (parentCardResult.isErr()) {
        return Result.fail<string>(parentCardResult.error);
      }
      
      if (!parentCardResult.value) {
        return Result.fail<string>("Parent card not found");
      }

      // Create CardType
      let annotationType: CardTypeEnum;
      switch (request.annotationType.toUpperCase()) {
        case 'NOTE':
          annotationType = CardTypeEnum.NOTE;
          break;
        case 'HIGHLIGHT':
          annotationType = CardTypeEnum.HIGHLIGHT;
          break;
        case 'SCREENSHOT':
          annotationType = CardTypeEnum.SCREENSHOT;
          break;
        default:
          return Result.fail<string>(`Invalid annotation type: ${request.annotationType}`);
      }
      
      const cardTypeResult = CardType.create(annotationType);
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

      // Create annotation Card
      const cardResult = Card.create({
        curatorId,
        type: cardType,
        content: cardContent,
        parentCardId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      if (cardResult.isErr()) {
        return Result.fail<string>(cardResult.error);
      }
      const card = cardResult.value;

      // Save annotation card
      const saveResult = await this.libraryService.addCardToLibrary(card);
      if (saveResult.isErr()) {
        return Result.fail<string>(saveResult.error);
      }

      return Result.ok<string>(card.cardId.getStringValue());
    } catch (error) {
      return Result.fail<string>(`Error annotating card: ${error}`);
    }
  }
}
