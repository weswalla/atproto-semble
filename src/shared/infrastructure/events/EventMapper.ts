import { IDomainEvent } from '../../domain/events/IDomainEvent';
import { CardAddedToLibraryEvent } from '../../../modules/cards/domain/events/CardAddedToLibraryEvent';
import { CardId } from '../../../modules/cards/domain/value-objects/CardId';
import { CuratorId } from '../../../modules/cards/domain/value-objects/CuratorId';
import { EventNames } from './EventConfig';

export interface SerializedEvent {
  eventType: string;
  aggregateId: string;
  dateTimeOccurred: string;
}

export interface SerializedCardAddedToLibraryEvent extends SerializedEvent {
  eventType: typeof EventNames.CARD_ADDED_TO_LIBRARY;
  cardId: string;
  curatorId: string;
}

export type SerializedEventUnion = SerializedCardAddedToLibraryEvent;

export class EventMapper {
  static toSerialized(event: IDomainEvent): SerializedEventUnion {
    if (event instanceof CardAddedToLibraryEvent) {
      return {
        eventType: EventNames.CARD_ADDED_TO_LIBRARY,
        aggregateId: event.getAggregateId().toString(),
        dateTimeOccurred: event.dateTimeOccurred.toISOString(),
        cardId: event.cardId.getValue().toString(),
        curatorId: event.curatorId.value,
      };
    }

    throw new Error(
      `Unknown event type for serialization: ${event.constructor.name}`,
    );
  }

  static fromSerialized(eventData: SerializedEventUnion): IDomainEvent {
    switch (eventData.eventType) {
      case EventNames.CARD_ADDED_TO_LIBRARY: {
        const cardId = CardId.createFromString(eventData.cardId).unwrap();
        const curatorId = CuratorId.create(eventData.curatorId).unwrap();
        const dateTimeOccurred = new Date(eventData.dateTimeOccurred);

        return CardAddedToLibraryEvent.reconstruct(
          cardId,
          curatorId,
          dateTimeOccurred,
        ).unwrap();
      }
      default:
        throw new Error(
          `Unknown event type for deserialization: ${eventData.eventType}`,
        );
    }
  }
}
