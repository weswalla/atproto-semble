import { ApiClient } from '@/api-client/ApiClient';
import { getAccessToken } from '@/services/auth';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

interface Props {
  limit?: number;
}

export default function useMyCards(props?: Props) {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => getAccessToken(),
  );

  const limit = props?.limit ?? 16;

  const query = useSuspenseInfiniteQuery({
    queryKey: ['my cards', limit],
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) => {
      return apiClient.getMyUrlCards({ limit, page: pageParam });
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.currentPage + 1;
      }
      return undefined;
    },
  });

  return query;
}
