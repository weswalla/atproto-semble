import { CardAddedToLibraryEvent } from '../../../cards/domain/events/CardAddedToLibraryEvent';
import { IFeedService } from '../ports/IFeedService';
import { IEventHandler } from '../../../../shared/application/events/IEventSubscriber';
import { Result, ok, err } from '../../../../shared/core/Result';

export class CardAddedToLibraryEventHandler implements IEventHandler<CardAddedToLibraryEvent> {
  constructor(private feedService: IFeedService) {}

  async handle(event: CardAddedToLibraryEvent): Promise<Result<void>> {
    try {
      const result = await this.feedService.processCardAddedToLibrary(event);
      
      if (result.isErr()) {
        console.error(
          'Error processing CardAddedToLibraryEvent in feeds:',
          result.error,
        );
        return err(result.error);
      }

      return ok(undefined);
    } catch (error) {
      console.error(
        'Unexpected error handling CardAddedToLibraryEvent in feeds:',
        error,
      );
      return err(error as Error);
    }
  }
}
