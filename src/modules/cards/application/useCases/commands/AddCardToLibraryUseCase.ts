import { Result, ok, err } from "../../../../../shared/core/Result";
import { UseCase } from "../../../../../shared/core/UseCase";
import { UseCaseError } from "../../../../../shared/core/UseCaseError";
import { AppError } from "../../../../../shared/core/AppError";
import { ICardRepository } from "../../../domain/ICardRepository";
import { CardId } from "../../../domain/value-objects/CardId";
import { CuratorId } from "../../../../annotations/domain/value-objects/CuratorId";
import { CardLibraryService } from "../../../domain/services/CardLibraryService";

export interface AddCardToLibraryDTO {
  cardId: string;
  curatorId: string;
}

export interface AddCardToLibraryResponseDTO {
  cardId: string;
}

export class ValidationError extends UseCaseError {
  constructor(message: string) {
    super(message);
  }
}

export class AddCardToLibraryUseCase
  implements
    UseCase<
      AddCardToLibraryDTO,
      Result<
        AddCardToLibraryResponseDTO,
        ValidationError | AppError.UnexpectedError
      >
    >
{
  constructor(
    private cardRepository: ICardRepository,
    private cardLibraryService: CardLibraryService
  ) {}

  async execute(
    request: AddCardToLibraryDTO
  ): Promise<
    Result<
      AddCardToLibraryResponseDTO,
      ValidationError | AppError.UnexpectedError
    >
  > {
    try {
      // Validate and create CuratorId
      const curatorIdResult = CuratorId.create(request.curatorId);
      if (curatorIdResult.isErr()) {
        return err(
          new ValidationError(
            `Invalid curator ID: ${curatorIdResult.error.message}`
          )
        );
      }
      const curatorId = curatorIdResult.value;

      // Validate and create CardId
      const cardIdResult = CardId.createFromString(request.cardId);
      if (cardIdResult.isErr()) {
        return err(
          new ValidationError(
            `Invalid card ID: ${cardIdResult.error.message}`
          )
        );
      }
      const cardId = cardIdResult.value;

      // Find the card
      const cardResult = await this.cardRepository.findById(cardId);
      if (cardResult.isErr()) {
        return err(AppError.UnexpectedError.create(cardResult.error));
      }

      const card = cardResult.value;
      if (!card) {
        return err(new ValidationError(`Card not found: ${request.cardId}`));
      }

      // Add card to library using domain service
      const addToLibraryResult = await this.cardLibraryService.addCardToLibrary(
        card,
        curatorId
      );
      if (addToLibraryResult.isErr()) {
        if (addToLibraryResult.error instanceof AppError.UnexpectedError) {
          return err(addToLibraryResult.error);
        }
        return err(new ValidationError(addToLibraryResult.error.message));
      }

      return ok({
        cardId: card.cardId.getStringValue(),
      });
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }
}
