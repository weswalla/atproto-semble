import { ApiClient } from '@/api-client/ApiClient';
import { createClientTokenManager } from '@/services/auth';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

interface Props {
  limit?: number;
}

export default function useMyFeed(props?: Props) {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    createClientTokenManager(),
  );

  const limit = props?.limit ?? 15;

  const query = useSuspenseInfiniteQuery({
    queryKey: ['my feed', limit],
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) => {
      return apiClient.getGlobalFeed({ limit, page: pageParam });
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
