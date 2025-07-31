import { CardAddedToCollectionEvent } from '../../../cards/domain/events/CardAddedToCollectionEvent';
import { IEventHandler } from '../../../../shared/application/events/IEventSubscriber';
import { Result, ok, err } from '../../../../shared/core/Result';
import {
  AddActivityToFeedUseCase,
  AddCardToCollectionActivityDTO,
} from '../useCases/commands/AddActivityToFeedUseCase';
import { ActivityTypeEnum } from '../../domain/value-objects/ActivityType';

export class CardAddedToCollectionEventHandler
  implements IEventHandler<CardAddedToCollectionEvent>
{
  constructor(private addActivityToFeedUseCase: AddActivityToFeedUseCase) {}

  async handle(event: CardAddedToCollectionEvent): Promise<Result<void>> {
    try {
      const request: AddCardToCollectionActivityDTO = {
        type: ActivityTypeEnum.CARD_ADDED_TO_COLLECTION,
        actorId: event.addedBy.value,
        cardId: event.cardId.getStringValue(),
        collectionIds: [event.collectionId.getStringValue()],
        collectionNames: ['Unknown Collection'], // TODO: Fetch actual collection name
        // TODO: Fetch card metadata (title, URL) from card repository
        cardTitle: undefined,
        cardUrl: undefined,
      };

      const result = await this.addActivityToFeedUseCase.execute(request);

      if (result.isErr()) {
        console.error(
          '[FEEDS] Failed to add card-added-to-collection activity:',
          result.error,
        );
        return err(new Error(result.error.message));
      }

      return ok(undefined);
    } catch (error) {
      console.error(
        '[FEEDS] Unexpected error handling CardAddedToCollectionEvent:',
        error,
      );
      return err(error as Error);
    }
  }
}
