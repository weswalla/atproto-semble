import { createSembleClient } from '@/services/apiClient';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

interface Props {
  rkey: string;
  handle: string;
  limit?: number;
}

export default function useCollection(props: Props) {
  const apiClient = createSembleClient();

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
