import { CardAddedToCollectionEvent } from '../../../cards/domain/events/CardAddedToCollectionEvent';
import { IFeedService } from '../ports/IFeedService';
import { IEventHandler } from '../../../../shared/application/events/IEventSubscriber';
import { Result, ok, err } from '../../../../shared/core/Result';

export class CardAddedToCollectionEventHandler
  implements IEventHandler<CardAddedToCollectionEvent>
{
  constructor(private feedService: IFeedService) {}

  async handle(event: CardAddedToCollectionEvent): Promise<Result<void>> {
    try {
      console.log(
        `[FEEDS] Processing CardAddedToCollectionEvent for card ${event.cardId.getStringValue()} added to collection ${event.collectionId.getStringValue()}`,
      );

      // TODO: We need collection names and card metadata to create a proper activity
      // For now, we'll create a basic activity with just IDs
      const result = await this.feedService.addCardAddedToCollectionActivity(
        event.curatorId,
        event.cardId,
        [event.collectionId],
        ['Unknown Collection'], // TODO: Fetch actual collection name
        undefined, // TODO: Fetch card title
        undefined, // TODO: Fetch card URL
      );

      if (result.isErr()) {
        console.error(
          '[FEEDS] Failed to add card-added-to-collection activity:',
          result.error,
        );
        return err(result.error);
      }

      console.log(
        `[FEEDS] Successfully processed CardAddedToCollectionEvent for card ${event.cardId.getStringValue()}`,
      );
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
