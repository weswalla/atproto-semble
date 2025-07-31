import { IDomainEvent } from '../../domain/events/IDomainEvent';
import { CardAddedToLibraryEvent } from '../../../modules/cards/domain/events/CardAddedToLibraryEvent';
import { CardId } from '../../../modules/cards/domain/value-objects/CardId';
import { CuratorId } from '../../../modules/cards/domain/value-objects/CuratorId';
import { EventNames } from './EventConfig';

export interface SerializedEvent {
  eventType: string;
  aggregateId: string;
  dateTimeOccurred: string;
  [key: string]: any;
}

export class EventMapper {
  static toSerialized(event: IDomainEvent): SerializedEvent {
    const baseData: SerializedEvent = {
      eventType: event.eventName,
      aggregateId: event.getAggregateId().toString(),
      dateTimeOccurred: event.dateTimeOccurred.toISOString(),
    };

    // Add event-specific data based on event type
    if (event instanceof CardAddedToLibraryEvent) {
      return {
        ...baseData,
        cardId: event.cardId.getValue().toString(),
        curatorId: event.curatorId.value,
      };
    }

    throw new Error(`Unknown event type for serialization: ${event.constructor.name}`);
  }

  static fromSerialized(eventData: SerializedEvent): IDomainEvent {
    switch (eventData.eventType) {
      case EventNames.CARD_ADDED_TO_LIBRARY: {
        const cardId = CardId.create(eventData.cardId).unwrap();
        const curatorId = CuratorId.create(eventData.curatorId).unwrap();
        
        const event = new CardAddedToLibraryEvent(cardId, curatorId);
        // Override the dateTimeOccurred with the serialized value
        (event as any).dateTimeOccurred = new Date(eventData.dateTimeOccurred);
        
        return event;
      }
      default:
        throw new Error(`Unknown event type for deserialization: ${eventData.eventType}`);
    }
  }
}
