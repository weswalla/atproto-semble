import { ApiClient } from '@/api-client/ApiClient';
import { createClientTokenManager } from '@/services/auth';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

interface Props {
  didOrHandle: string;
  limit?: number;
}

export default function useCards(props: Props) {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000',
    createClientTokenManager(),
  );

  const limit = props?.limit ?? 16;

  const cards = useSuspenseInfiniteQuery({
    queryKey: ['cards', props.didOrHandle, limit],
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) => {
      return apiClient.getUrlCards({
        limit,
        page: pageParam,
        identifier: props.didOrHandle,
      });
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.currentPage + 1;
      }
      return undefined;
    },
  });

  return cards;
}
