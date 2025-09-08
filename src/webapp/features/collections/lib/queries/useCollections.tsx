import { ApiClient } from '@/api-client/ApiClient';
import { getAccessToken } from '@/services/auth';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

interface Props {
  limit?: number;
}

export default function useCollections(props?: Props) {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => getAccessToken(),
  );

  const limit = props?.limit ?? 15;

  return useSuspenseInfiniteQuery({
    queryKey: ['collections', limit],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      apiClient.getMyCollections({ limit, page: pageParam }),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.currentPage + 1
        : undefined;
    },
  });
}
