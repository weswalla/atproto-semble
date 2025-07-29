import { CardAddedToLibraryEvent } from '../../../cards/domain/events/CardAddedToLibraryEvent';
import { INotificationService } from '../ports/INotificationService';

export class CardAddedToLibraryEventHandler {
  constructor(private notificationService: INotificationService) {}

  async handle(event: CardAddedToLibraryEvent): Promise<void> {
    try {
      const result = await this.notificationService.processCardAddedToLibrary(
        event,
      );

      if (result.isErr()) {
        console.error(
          'Error processing CardAddedToLibraryEvent in notifications:',
          result.error,
        );
      }
    } catch (error) {
      console.error(
        'Unexpected error handling CardAddedToLibraryEvent in notifications:',
        error,
      );
    }
  }
}
