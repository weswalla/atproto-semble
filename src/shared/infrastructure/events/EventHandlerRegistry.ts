import { DomainEvents } from '../../domain/events/DomainEvents';
import { CardAddedToLibraryEvent } from '../../../modules/cards/domain/events/CardAddedToLibraryEvent';
import { CardAddedToLibraryEventHandler as FeedsCardAddedToLibraryEventHandler } from '../../../modules/feeds/application/eventHandlers/CardAddedToLibraryEventHandler';
import { CardAddedToLibraryEventHandler as NotificationsCardAddedToLibraryEventHandler } from '../../../modules/notifications/application/eventHandlers/CardAddedToLibraryEventHandler';

export class EventHandlerRegistry {
  constructor(
    private feedsCardAddedToLibraryHandler: FeedsCardAddedToLibraryEventHandler,
    private notificationsCardAddedToLibraryHandler: NotificationsCardAddedToLibraryEventHandler,
  ) {}

  registerAllHandlers(): void {
    // Register CardAddedToLibraryEvent handlers
    DomainEvents.register(
      (event: CardAddedToLibraryEvent) =>
        this.feedsCardAddedToLibraryHandler.handle(event),
      CardAddedToLibraryEvent.name,
    );

    DomainEvents.register(
      (event: CardAddedToLibraryEvent) =>
        this.notificationsCardAddedToLibraryHandler.handle(event),
      CardAddedToLibraryEvent.name,
    );
  }

  clearAllHandlers(): void {
    DomainEvents.clearHandlers();
  }
}
