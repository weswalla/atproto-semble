import { ApiClient } from '@/api-client/ApiClient';
import { getAccessToken } from '@/services/auth';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

interface Props {
  id: string;
  limit?: number;
}

export default function useCollection(props: Props) {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => getAccessToken(),
  );

  const limit = props.limit ?? 20;

  return useSuspenseInfiniteQuery({
    queryKey: ['collection', props.id, limit],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      apiClient.getCollectionPage(props.id, { limit, page: pageParam }),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.currentPage + 1
        : undefined;
    },
  });
}
