import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getLibrariesForUrl } from '../dal';
import { sembleKeys } from '../sembleKeys';

interface Props {
  url: string;
  limit?: number;
}

export default function useSembleLibraries(props: Props) {
  const limit = props?.limit ?? 16;

  const libraries = useSuspenseInfiniteQuery({
    queryKey: sembleKeys.librariesInfinite(props.url),
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) => {
      return getLibrariesForUrl(props.url, { page: pageParam, limit });
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.currentPage + 1;
      }
      return undefined;
    },
  });

  return libraries;
}
