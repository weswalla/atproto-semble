export const QueueNames = {
  EVENTS: 'events',
} as const;

export type QueueName = typeof QueueNames[keyof typeof QueueNames];

export const QueueOptions = {
  [QueueNames.EVENTS]: {
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 2000 },
    removeOnComplete: 50,
    removeOnFail: 25,
  },
} as const;
