import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getMyCollections } from '../dal';
import { collectionKeys } from '../collectionKeys';

interface Props {
  limit?: number;
}

export default function useMyCollections(props?: Props) {
  const limit = props?.limit ?? 15;

  return useSuspenseInfiniteQuery({
    queryKey: collectionKeys.mine(),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => getMyCollections({ limit, page: pageParam }),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.currentPage + 1
        : undefined;
    },
  });
}
