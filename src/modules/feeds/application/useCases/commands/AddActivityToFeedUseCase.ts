import { Result, ok, err } from '../../../../../shared/core/Result';
import { UseCase } from '../../../../../shared/core/UseCase';
import { UseCaseError } from '../../../../../shared/core/UseCaseError';
import { AppError } from '../../../../../shared/core/AppError';
import { IFeedService } from '../../ports/IFeedService';
import { CuratorId } from '../../../../cards/domain/value-objects/CuratorId';
import { CardId } from '../../../../cards/domain/value-objects/CardId';
import { CollectionId } from '../../../../cards/domain/value-objects/CollectionId';
import { ActivityTypeEnum } from '../../../domain/value-objects/ActivityType';

export interface AddCardToLibraryActivityDTO {
  type: ActivityTypeEnum.CARD_ADDED_TO_LIBRARY;
  actorId: string;
  cardId: string;
  cardTitle?: string;
  cardUrl?: string;
}

export interface AddCardToCollectionActivityDTO {
  type: ActivityTypeEnum.CARD_ADDED_TO_COLLECTION;
  actorId: string;
  cardId: string;
  collectionIds: string[];
  collectionNames: string[];
  cardTitle?: string;
  cardUrl?: string;
}

export type AddActivityToFeedDTO = 
  | AddCardToLibraryActivityDTO 
  | AddCardToCollectionActivityDTO;

export interface AddActivityToFeedResponseDTO {
  activityId: string;
}

export class ValidationError extends UseCaseError {
  constructor(message: string) {
    super(message);
  }
}

export class AddActivityToFeedUseCase
  implements UseCase<AddActivityToFeedDTO, Result<AddActivityToFeedResponseDTO>>
{
  constructor(private feedService: IFeedService) {}

  async execute(
    request: AddActivityToFeedDTO,
  ): Promise<Result<AddActivityToFeedResponseDTO, ValidationError | AppError.UnexpectedError>> {
    try {
      // Validate and create CuratorId
      const actorIdResult = CuratorId.create(request.actorId);
      if (actorIdResult.isErr()) {
        return err(new ValidationError(`Invalid actor ID: ${actorIdResult.error.message}`));
      }
      const actorId = actorIdResult.value;

      // Validate and create CardId
      const cardIdResult = CardId.createFromString(request.cardId);
      if (cardIdResult.isErr()) {
        return err(new ValidationError(`Invalid card ID: ${cardIdResult.error.message}`));
      }
      const cardId = cardIdResult.value;

      let activityResult;

      switch (request.type) {
        case ActivityTypeEnum.CARD_ADDED_TO_LIBRARY:
          activityResult = await this.feedService.addCardAddedToLibraryActivity(
            actorId,
            cardId,
            request.cardTitle,
            request.cardUrl,
          );
          break;

        case ActivityTypeEnum.CARD_ADDED_TO_COLLECTION:
          // Validate collection IDs
          const collectionIds: CollectionId[] = [];
          for (const collectionIdStr of request.collectionIds) {
            const collectionIdResult = CollectionId.createFromString(collectionIdStr);
            if (collectionIdResult.isErr()) {
              return err(new ValidationError(`Invalid collection ID: ${collectionIdResult.error.message}`));
            }
            collectionIds.push(collectionIdResult.value);
          }

          // Validate collection names array
          if (request.collectionNames.length !== request.collectionIds.length) {
            return err(new ValidationError('Collection IDs and names arrays must have the same length'));
          }

          activityResult = await this.feedService.addCardAddedToCollectionActivity(
            actorId,
            cardId,
            collectionIds,
            request.collectionNames,
            request.cardTitle,
            request.cardUrl,
          );
          break;

        default:
          return err(new ValidationError(`Unsupported activity type: ${(request as any).type}`));
      }

      if (activityResult.isErr()) {
        return err(new ValidationError(activityResult.error.message));
      }

      return ok({
        activityId: activityResult.value.activityId.getStringValue(),
      });
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }
}
