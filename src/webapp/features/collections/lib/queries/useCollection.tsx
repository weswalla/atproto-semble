import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getCollectionPageByAtUri } from '../dal';

interface Props {
  rkey: string;
  handle: string;
  limit?: number;
}

export default function useCollection(props: Props) {
  const limit = props.limit ?? 20;

  return useSuspenseInfiniteQuery({
    queryKey: ['collection', props.rkey, props.handle, limit],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getCollectionPageByAtUri({
        recordKey: props.rkey,
        handle: props.handle,
        params: { limit, page: pageParam },
      }),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.currentPage + 1
        : undefined;
    },
  });
}
