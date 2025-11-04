import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getUrlCards } from '../dal';
import { cardKeys } from '../cardKeys';

interface Props {
  didOrHandle: string;
  limit?: number;
}

export default function useCards(props: Props) {
  const limit = props?.limit ?? 16;

  const cards = useSuspenseInfiniteQuery({
    queryKey: cardKeys.infinite(props.didOrHandle),
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) => {
      return getUrlCards(props.didOrHandle, {
        limit,
        page: pageParam,
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
