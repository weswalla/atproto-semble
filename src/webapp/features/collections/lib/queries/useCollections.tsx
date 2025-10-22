import { ApiClient } from '@/api-client/ApiClient';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

interface Props {
  didOrHandle: string;
  limit?: number;
}

export default function useCollections(props: Props) {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000',
  );

  const limit = props?.limit ?? 15;

  return useSuspenseInfiniteQuery({
    queryKey: ['collections', props.didOrHandle, limit],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      apiClient.getCollections({
        limit,
        page: pageParam,
        identifier: props.didOrHandle,
      }),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.currentPage + 1
        : undefined;
    },
  });
}
