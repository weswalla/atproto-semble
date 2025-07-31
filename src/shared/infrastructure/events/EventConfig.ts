export const EventNames = {
  CARD_ADDED_TO_LIBRARY: 'CardAddedToLibraryEvent',
  CARD_ADDED_TO_COLLECTION: 'CardAddedToCollectionEvent',
  COLLECTION_CREATED: 'CollectionCreatedEvent',
} as const;

export type EventName = (typeof EventNames)[keyof typeof EventNames];
