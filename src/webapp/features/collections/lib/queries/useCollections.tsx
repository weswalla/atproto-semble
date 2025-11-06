import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getCollections } from '../dal';
import { collectionKeys } from '../collectionKeys';

interface Props {
  didOrHandle: string;
  limit?: number;
}

export default function useCollections(props: Props) {
  const limit = props?.limit ?? 15;

  return useSuspenseInfiniteQuery({
    queryKey: collectionKeys.infinite(props.didOrHandle, props.limit),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getCollections(props.didOrHandle, {
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
