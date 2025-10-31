export const cardKeys = {
  all: () => ['cards'] as const,
  card: (id: string) => [...cardKeys.all(), id] as const,
  byUrl: (url: string) => [...cardKeys.all(), url] as const,
  mine: () => [...cardKeys.all(), 'mine'] as const,
  search: (query: string) => [...cardKeys.all(), 'search', query],
  bySembleUrl: (url: string) => [...cardKeys.all(), url],
  libraries: (id: string) => [...cardKeys.all(), 'libraries', id],
  infinite: () => [...cardKeys.all(), 'infinite'],
};
