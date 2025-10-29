import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getMyUrlCards } from '../dal';

interface Props {
  limit?: number;
}

export default function useMyCards(props?: Props) {
  const limit = props?.limit ?? 16;

  const myCards = useSuspenseInfiniteQuery({
    queryKey: ['my cards', limit],
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) => {
      return getMyUrlCards({ page: pageParam, limit });
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.currentPage + 1;
      }
      return undefined;
    },
  });

  return myCards;
}
