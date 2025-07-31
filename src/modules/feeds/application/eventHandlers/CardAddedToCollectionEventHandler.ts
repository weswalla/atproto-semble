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

      // For now, we'll just log the event - you can extend this to update feeds
      // const result = await this.feedService.processCardAddedToCollection(event);

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
