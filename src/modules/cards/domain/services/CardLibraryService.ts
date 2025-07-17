import { Result, ok, err } from '../../../../shared/core/Result';
import { Card } from '../Card';
import { CuratorId } from '../value-objects/CuratorId';
import { ICardPublisher } from '../../application/ports/ICardPublisher';
import { ICardRepository } from '../ICardRepository';
import { AppError } from '../../../../shared/core/AppError';
import { UseCaseError } from '../../../../shared/core/UseCaseError';
import { DomainService } from '../../../../shared/domain/DomainService';

export class CardLibraryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CardLibraryValidationError';
  }
}

export class CardLibraryService implements DomainService {
  constructor(
    private cardRepository: ICardRepository,
    private cardPublisher: ICardPublisher,
  ) {}

  async addCardToLibrary(
    card: Card,
    curatorId: CuratorId,
  ): Promise<
    Result<void, CardLibraryValidationError | AppError.UnexpectedError>
  > {
    try {
      // Check if card is already in curator's library
      const isInLibrary = card.isInLibrary(curatorId);

      if (isInLibrary) {
        // Card is already in library, nothing to do
        return ok(undefined);
      }

      // Publish card to library
      const publishResult = await this.cardPublisher.publishCardToLibrary(
        card,
        curatorId,
      );
      if (publishResult.isErr()) {
        return err(
          new CardLibraryValidationError(
            `Failed to publish card to library: ${publishResult.error.message}`,
          ),
        );
      }

      // Mark card as published in library
      card.addToLibrary(curatorId);
      card.markCardInLibraryAsPublished(curatorId, publishResult.value);

      // Save updated card
      const saveResult = await this.cardRepository.save(card);
      if (saveResult.isErr()) {
        return err(AppError.UnexpectedError.create(saveResult.error));
      }

      return ok(undefined);
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }

  async removeCardFromLibrary(
    card: Card,
    curatorId: CuratorId,
  ): Promise<
    Result<void, CardLibraryValidationError | AppError.UnexpectedError>
  > {
    try {
      // Check if card is in curator's library
      const isInLibrary = card.isInLibrary(curatorId);

      if (!isInLibrary) {
        // Card is not in library, nothing to do
        return ok(undefined);
      }

      // Get library info to check if it was published
      const libraryInfo = card.getLibraryInfo(curatorId);
      if (libraryInfo?.publishedRecordId) {
        // Unpublish card from library
        const unpublishResult =
          await this.cardPublisher.unpublishCardFromLibrary(
            libraryInfo.publishedRecordId,
            libraryInfo.curatorId,
          );
        if (unpublishResult.isErr()) {
          return err(
            new CardLibraryValidationError(
              `Failed to unpublish card from library: ${unpublishResult.error.message}`,
            ),
          );
        }
      }

      // Remove card from library
      const removeResult = card.removeFromLibrary(curatorId);
      if (removeResult.isErr()) {
        return err(
          new CardLibraryValidationError(
            `Failed to remove card from library: ${removeResult.error.message}`,
          ),
        );
      }

      // Save updated card
      const saveResult = await this.cardRepository.save(card);
      if (saveResult.isErr()) {
        return err(AppError.UnexpectedError.create(saveResult.error));
      }

      return ok(undefined);
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }
}
