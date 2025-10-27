import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getMyCollections } from '../dal';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  limit?: number;
}

export default function useMyCollections(props?: Props) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // don't trigger Suspense
    return { data: null };
  }

  const limit = props?.limit ?? 15;

  return useSuspenseInfiniteQuery({
    queryKey: ['collections', limit],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => getMyCollections({ limit, page: pageParam }),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.currentPage + 1
        : undefined;
    },
  });
}
