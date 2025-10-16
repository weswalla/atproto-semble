import { ApiClient } from '@/api-client/ApiClient';
import { createClientTokenManager } from '@/services/auth';
import { useQuery } from '@tanstack/react-query';

interface Props {
  query: string;
  params?: {
    limit?: number;
  };
}

export default function useCollectionSearch(props: Props) {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000',
    createClientTokenManager(),
  );

  // TODO: replace with infinite suspense query
  const collections = useQuery({
    queryKey: ['collection search', props.query, props.params?.limit],
    queryFn: () =>
      apiClient.getMyCollections({
        limit: props.params?.limit ?? 10,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        searchText: props.query || undefined,
      }),
    enabled: !!props.query,
  });

  return collections;
}
