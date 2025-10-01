import { ApiClient } from '@/api-client/ApiClient';
import { createClientTokenManager } from '@/services/auth';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

interface Props {
  rkey: string;
  handle: string;
  limit?: number;
}

export default function useCollection(props: Props) {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    createClientTokenManager(),
  );

  const limit = props.limit ?? 20;

  return useSuspenseInfiniteQuery({
    queryKey: ['collection', props.rkey, props.handle, limit],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      apiClient.getCollectionPageByAtUri({
        recordKey: props.rkey,
        handle: props.handle,
        limit,
        page: pageParam,
      }),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.currentPage + 1
        : undefined;
    },
  });
}
