export const EventNames = {
  CARD_ADDED_TO_LIBRARY: 'CardAddedToLibraryEvent',
} as const;

export type EventName = (typeof EventNames)[keyof typeof EventNames];
