export const collectionKeys = {
  all: () => ['collections'] as const,
  collection: (id: string) => [...collectionKeys.all(), id] as const,
  mine: (limit?: number) => [...collectionKeys.all(), 'mine', limit] as const,
  search: (query: string) => [...collectionKeys.all(), 'search', query],
  bySembleUrl: (url: string) => [...collectionKeys.all(), url],
  infinite: (id?: string, limit?: number) => [
    ...collectionKeys.all(),
    'infinite',
    id,
    limit,
  ],
};
