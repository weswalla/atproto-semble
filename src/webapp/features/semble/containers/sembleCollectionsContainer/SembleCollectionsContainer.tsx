'use client';

import useSembleCollections from '@/features/collections/lib/queries/useSembleCollectionts';
import InfiniteScroll from '@/components/contentDisplay/infiniteScroll/InfiniteScroll';
import { Center, Grid, Loader } from '@mantine/core';
import SembleCollectionsError from './Error.SembleCollectionsContainer';
import CollectionCard from '@/features/collections/components/collectionCard/CollectionCard';
import SembleEmptyTab from '../../components/sembleEmptyTab/SembleEmptyTab';
import { BiCollection } from 'react-icons/bi';

interface Props {
  url: string;
}

export default function SembleCollectionsContainer(props: Props) {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
  } = useSembleCollections({ url: props.url });

  const allCollections =
    data?.pages.flatMap((page) => page.collections ?? []) ?? [];

  if (error) {
    return <SembleCollectionsError />;
  }

  if (allCollections.length === 0) {
    return <SembleEmptyTab message="No collections" icon={BiCollection} />;
  }

  return (
    <InfiniteScroll
      dataLength={allCollections.length}
      hasMore={!!hasNextPage}
      isInitialLoading={isPending}
      isLoading={isFetchingNextPage}
      loadMore={fetchNextPage}
      manualLoadButton={false}
      loader={
        <Center>
          <Loader />
        </Center>
      }
    >
      <Grid gutter="md">
        {allCollections.map((col) => (
          <Grid.Col
            key={col.id}
            span={{
              base: 12,
              sm: 6,
              lg: 3,
            }}
          >
            {/*<CollectionCard key={col.id} collection={col} />*/}
          </Grid.Col>
        ))}
      </Grid>
    </InfiniteScroll>
  );
}
