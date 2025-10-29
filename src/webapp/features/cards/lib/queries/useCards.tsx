import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getUrlCards } from '../dal';

interface Props {
  didOrHandle: string;
  limit?: number;
}

export default function useCards(props: Props) {
  const limit = props?.limit ?? 16;

  const cards = useSuspenseInfiniteQuery({
    queryKey: ['cards', props.didOrHandle, limit],
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
