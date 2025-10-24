'use client';

import useSembleSimilarCards from '../../lib/queries/useSembleSimilarCards';
import InfiniteScroll from '@/components/contentDisplay/infiniteScroll/InfiniteScroll';
import { Grid } from '@mantine/core';
import SembleSimilarCardsContainerError from './Error.SembleSimilarCardsContainer';
import SimilarUrlCard from '../../components/similarUrlCard/SimilarUrlCard';
import SembleEmptyTab from '../../components/sembleEmptyTab/SembleEmptyTab';
import { BiLink } from 'react-icons/bi';
import { useNavbarContext } from '@/providers/navbar';

interface Props {
  url: string;
}

export default function SembleSimilarCardsContainer(props: Props) {
  const { desktopOpened } = useNavbarContext();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
  } = useSembleSimilarCards({ url: props.url });

  const allSimilarUrls = data?.pages.flatMap((page) => page.urls ?? []) ?? [];

  if (error) {
    return <SembleSimilarCardsContainerError />;
  }

  if (allSimilarUrls.length === 0) {
    return <SembleEmptyTab message="No similar cards found" icon={BiLink} />;
  }

  return (
    <InfiniteScroll
      dataLength={allSimilarUrls.length}
      hasMore={!!hasNextPage}
      isInitialLoading={isPending}
      isLoading={isFetchingNextPage}
      loadMore={fetchNextPage}
    >
      <Grid gutter="md">
        {allSimilarUrls.map((urlView) => (
          <Grid.Col
            key={urlView.url}
            span={{
              base: 12,
              xs: desktopOpened ? 12 : 6,
              sm: desktopOpened ? 6 : 4,
              md: 4,
              lg: 3,
            }}
          >
            <SimilarUrlCard urlView={urlView} />
          </Grid.Col>
        ))}
      </Grid>
    </InfiniteScroll>
  );
}
