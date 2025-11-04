export const collectionKeys = {
  all: () => ['collections'] as const,
  collection: (id: string) => [...collectionKeys.all(), id] as const,
  mine: () => [...collectionKeys.all(), 'mine'] as const,
  search: (query: string) => [...collectionKeys.all(), 'search', query],
  bySembleUrl: (url: string) => [...collectionKeys.all(), url],
  infinite: (id?: string) => [...collectionKeys.all(), 'infinite', id],
};
