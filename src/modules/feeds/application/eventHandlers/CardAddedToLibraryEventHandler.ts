import { CardAddedToLibraryEvent } from '../../../cards/domain/events/CardAddedToLibraryEvent';
import { IFeedService } from '../ports/IFeedService';
import { IEventHandler } from '../../../../shared/application/events/IEventSubscriber';
import { Result, ok, err } from '../../../../shared/core/Result';

export class CardAddedToLibraryEventHandler
  implements IEventHandler<CardAddedToLibraryEvent>
{
  constructor(private feedService: IFeedService) {}

  async handle(event: CardAddedToLibraryEvent): Promise<Result<void>> {
    try {
      console.log(
        `[FEEDS] Processing CardAddedToLibraryEvent for card ${event.cardId.getStringValue()}`,
      );

      const result = await this.feedService.processCardAddedToLibrary(event);

      if (result.isErr()) {
        console.error(
          '[FEEDS] Error processing CardAddedToLibraryEvent:',
          result.error,
        );
        return err(new Error(result.error.message));
      }

      console.log(
        `[FEEDS] Successfully processed CardAddedToLibraryEvent for card ${event.cardId.getStringValue()}`,
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
