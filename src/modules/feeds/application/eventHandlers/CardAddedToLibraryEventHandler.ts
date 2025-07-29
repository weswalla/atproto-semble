import { CardAddedToLibraryEvent } from '../../../cards/domain/events/CardAddedToLibraryEvent';
import { IFeedService } from '../ports/IFeedService';

export class CardAddedToLibraryEventHandler {
  constructor(private feedService: IFeedService) {}

  async handle(event: CardAddedToLibraryEvent): Promise<void> {
    try {
      const result = await this.feedService.processCardAddedToLibrary(event);
      
      if (result.isErr()) {
        console.error(
          'Error processing CardAddedToLibraryEvent in feeds:',
          result.error,
        );
      }
    } catch (error) {
      console.error(
        'Unexpected error handling CardAddedToLibraryEvent in feeds:',
        error,
      );
    }
  }
}
