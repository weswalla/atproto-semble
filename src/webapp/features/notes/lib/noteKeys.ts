export const noteKeys = {
  all: () => ['notes'] as const,
  note: (id: string) => [...noteKeys.all(), id] as const,
  bySembleUrl: (url: string) => [...noteKeys.all(), url],
  infinite: () => [...noteKeys.all(), 'infinite'],
};
