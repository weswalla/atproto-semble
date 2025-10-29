import { useQuery } from '@tanstack/react-query';
import { getMyCollections } from '../dal';

interface Props {
  query: string;
  params?: {
    limit?: number;
  };
}

export default function useCollectionSearch(props: Props) {
  // TODO: replace with infinite suspense query
  const collections = useQuery({
    queryKey: ['collection search', props.query, props.params?.limit],
    queryFn: () =>
      getMyCollections({
        limit: props.params?.limit ?? 10,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        searchText: props.query || undefined,
      }),
    enabled: !!props.query,
  });

  return collections;
}
