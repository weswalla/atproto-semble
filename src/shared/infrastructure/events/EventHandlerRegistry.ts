import { CardAddedToLibraryEvent } from '../../../modules/cards/domain/events/CardAddedToLibraryEvent';
import { IEventPublisher } from '../../application/events/IEventPublisher';

export class EventHandlerRegistry {
  constructor(private eventPublisher: IEventPublisher) {}

  registerAllHandlers(): void {
    // Note: With the simplified architecture, event handlers are now registered
    // directly with the IEventSubscriber implementation (e.g., BullMQEventSubscriber)
    // This class can be removed or repurposed for other event system setup
    console.log('EventHandlerRegistry: Using simplified event architecture');
  }

  clearAllHandlers(): void {
    // No longer needed with simplified architecture
    console.log('EventHandlerRegistry: No handlers to clear in simplified architecture');
  }
}
