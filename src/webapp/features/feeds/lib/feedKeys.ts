export const feedKeys = {
  all: () => ['feeds'] as const,
  infinite: () => [...feedKeys.all(), 'infinite'],
};
