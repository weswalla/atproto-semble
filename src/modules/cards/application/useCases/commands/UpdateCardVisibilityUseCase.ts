import { Result, ok, err } from '../../../../../shared/core/Result';
import { BaseUseCase } from '../../../../../shared/core/UseCase';
import { UseCaseError } from '../../../../../shared/core/UseCaseError';
import { AppError } from '../../../../../shared/core/AppError';
import { IEventPublisher } from '../../../../../shared/application/events/IEventPublisher';
import { ICardRepository } from '../../../domain/ICardRepository';
import { ICollectionRepository } from '../../../domain/ICollectionRepository';
import { ICardPublisher } from '../../ports/ICardPublisher';
import { CardId } from '../../../domain/value-objects/CardId';
import { CuratorId } from '../../../domain/value-objects/CuratorId';
import {
  Visibility,
  parseVisibility,
} from '../../../domain/value-objects/Visibility';
import { AuthenticationError } from '../../../../../shared/core/AuthenticationError';

export interface UpdateCardVisibilityDTO {
  cardId: string;
  curatorId: string;
  visibility: 'PUBLIC' | 'PRIVATE';
}

export interface UpdateCardVisibilityResponseDTO {
  cardId: string;
  visibility: 'PUBLIC' | 'PRIVATE';
}

export class ValidationError extends UseCaseError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Moves a card between the curator's public repo and their private library
 * space: unpublish from the old location, flip visibility, republish to the
 * new location, and record the fresh published record id (the semble card id
 * never changes).
 */
export class UpdateCardVisibilityUseCase extends BaseUseCase<
  UpdateCardVisibilityDTO,
  Result<
    UpdateCardVisibilityResponseDTO,
    ValidationError | AuthenticationError | AppError.UnexpectedError
  >
> {
  constructor(
    private cardRepository: ICardRepository,
    private collectionRepository: ICollectionRepository,
    private cardPublisher: ICardPublisher,
    eventPublisher: IEventPublisher,
  ) {
    super(eventPublisher);
  }

  async execute(
    request: UpdateCardVisibilityDTO,
  ): Promise<
    Result<
      UpdateCardVisibilityResponseDTO,
      ValidationError | AuthenticationError | AppError.UnexpectedError
    >
  > {
    try {
      const curatorIdResult = CuratorId.create(request.curatorId);
      if (curatorIdResult.isErr()) {
        return err(
          new ValidationError(
            `Invalid curator ID: ${curatorIdResult.error.message}`,
          ),
        );
      }
      const curatorId = curatorIdResult.value;

      const cardIdResult = CardId.createFromString(request.cardId);
      if (cardIdResult.isErr()) {
        return err(
          new ValidationError(`Invalid card ID: ${cardIdResult.error.message}`),
        );
      }

      const visibilityResult = parseVisibility(request.visibility);
      if (visibilityResult.isErr()) {
        return err(new ValidationError(visibilityResult.error.message));
      }
      const targetVisibility = visibilityResult.value;

      const cardResult = await this.cardRepository.findById(cardIdResult.value);
      if (cardResult.isErr()) {
        return err(AppError.UnexpectedError.create(cardResult.error));
      }
      const card = cardResult.value;
      if (!card) {
        return err(new ValidationError('Card not found'));
      }
      if (!card.curatorId.equals(curatorId)) {
        return err(
          new ValidationError('Only the card owner can change its visibility'),
        );
      }

      if (card.visibility === targetVisibility) {
        return ok({ cardId: request.cardId, visibility: request.visibility });
      }

      // Going private: the card must not sit in any public collection.
      if (targetVisibility === Visibility.PRIVATE) {
        const collectionsResult = await this.collectionRepository.findByCardId(
          card.cardId,
        );
        if (collectionsResult.isErr()) {
          return err(AppError.UnexpectedError.create(collectionsResult.error));
        }
        const publicCollections = collectionsResult.value.filter(
          (collection) => collection.isPublicCollection,
        );
        if (publicCollections.length > 0) {
          return err(
            new ValidationError(
              `Cannot make card private while it is in ${publicCollections.length} public collection(s). Remove it from those collections first.`,
            ),
          );
        }
      }

      const wasPrivate = card.isPrivate;
      const libraryInfo = card.getLibraryInfo(curatorId);

      // 1) Unpublish the old record from its current location.
      if (libraryInfo?.publishedRecordId) {
        const unpublishResult =
          await this.cardPublisher.unpublishCardFromLibrary(
            libraryInfo.publishedRecordId,
            curatorId,
            { isPrivate: wasPrivate },
          );
        if (unpublishResult.isErr()) {
          if (unpublishResult.error instanceof AuthenticationError) {
            return err(unpublishResult.error);
          }
          return err(
            new ValidationError(
              `Failed to unpublish card: ${unpublishResult.error.message}`,
            ),
          );
        }
      }

      // 2) Flip visibility on the aggregate.
      const changeResult = card.changeVisibility(targetVisibility);
      if (changeResult.isErr()) {
        return err(new ValidationError(changeResult.error.message));
      }

      // 3) Republish to the new location and record the new published record id.
      if (libraryInfo) {
        const publishResult = await this.cardPublisher.publishCardToLibrary(
          card,
          curatorId,
        );
        if (publishResult.isErr()) {
          if (publishResult.error instanceof AuthenticationError) {
            return err(publishResult.error);
          }
          return err(
            new ValidationError(
              `Failed to republish card: ${publishResult.error.message}`,
            ),
          );
        }
        const markResult = card.markCardInLibraryAsPublished(
          curatorId,
          publishResult.value,
        );
        if (markResult.isErr()) {
          return err(new ValidationError(markResult.error.message));
        }
      }

      const saveResult = await this.cardRepository.save(card);
      if (saveResult.isErr()) {
        return err(AppError.UnexpectedError.create(saveResult.error));
      }

      return ok({ cardId: request.cardId, visibility: request.visibility });
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }
}
