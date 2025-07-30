import { DomainEvents } from '../../domain/events/DomainEvents';
import { CardAddedToLibraryEvent } from '../../../modules/cards/domain/events/CardAddedToLibraryEvent';
import { IEventPublisher } from '../../application/events/IEventPublisher';

export class EventHandlerRegistry {
  constructor(private eventPublisher: IEventPublisher) {}

  registerAllHandlers(): void {
    // Register distributed event publishing
    DomainEvents.register(
      async (event: CardAddedToLibraryEvent) => {
        try {
          await this.eventPublisher.publishEvents([event]);
        } catch (error) {
          console.error('Error publishing event to BullMQ:', error);
          // Don't fail the main operation if event publishing fails
        }
      },
      CardAddedToLibraryEvent.name,
    );
  }

  clearAllHandlers(): void {
    DomainEvents.clearHandlers();
  }
}
