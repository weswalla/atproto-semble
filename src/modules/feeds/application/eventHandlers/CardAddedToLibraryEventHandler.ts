import { CardAddedToLibraryEvent } from '../../../cards/domain/events/CardAddedToLibraryEvent';
import { IEventHandler } from '../../../../shared/application/events/IEventSubscriber';
import { Result, ok, err } from '../../../../shared/core/Result';
import {
  AddActivityToFeedUseCase,
  AddCardCollectedActivityDTO,
} from '../useCases/commands/AddActivityToFeedUseCase';
import { ActivityTypeEnum } from '../../domain/value-objects/ActivityType';

export class CardAddedToLibraryEventHandler
  implements IEventHandler<CardAddedToLibraryEvent>
{
  constructor(private addActivityToFeedUseCase: AddActivityToFeedUseCase) {}

  async handle(event: CardAddedToLibraryEvent): Promise<Result<void>> {
    try {
      const request: AddCardCollectedActivityDTO = {
        type: ActivityTypeEnum.CARD_COLLECTED,
        actorId: event.curatorId.value,
        cardId: event.cardId.getStringValue(),
        // No collection IDs for library-only additions
        collectionIds: undefined,
        // TODO: Fetch card metadata (title, URL) from card repository
        cardTitle: undefined,
        cardUrl: undefined,
      };

      const result = await this.addActivityToFeedUseCase.execute(request);

      if (result.isErr()) {
        console.error(
          '[FEEDS] Error processing CardAddedToLibraryEvent:',
          result.error,
        );
        return err(new Error(result.error.message));
      }

      console.log(
        `[FEEDS] Successfully processed CardAddedToLibraryEvent for card ${event.cardId.getStringValue()}, created activity ${result.value.activityId}`,
      );
      return ok(undefined);
    } catch (error) {
      console.error(
        '[FEEDS] Unexpected error handling CardAddedToLibraryEvent:',
        error,
      );
      return err(error as Error);
    }
  }
}
