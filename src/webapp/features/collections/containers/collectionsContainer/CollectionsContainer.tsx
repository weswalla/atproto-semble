'use client';

import { Container, Stack, SimpleGrid } from '@mantine/core';
import useCollections from '../../lib/queries/useCollections';
import CollectionCard from '../../components/collectionCard/CollectionCard';
import CreateCollectionDrawer from '../../components/createCollectionDrawer/CreateCollectionDrawer';
import { useState } from 'react';
import ProfileEmptyTab from '@/features/profile/components/profileEmptyTab/ProfileEmptyTab';
import { BiCollection } from 'react-icons/bi';
import InfiniteScroll from '@/components/contentDisplay/infiniteScroll/InfiniteScroll';

interface Props {
  handle: string;
}

export default function CollectionsContainer(props: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCollections({ didOrHandle: props.handle });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const collections =
    data?.pages.flatMap((page) => page.collections ?? []) ?? [];

  if (collections.length === 0) {
    return (
      <Container px="xs" py={'xl'} size="xl">
        <ProfileEmptyTab message="No collections" icon={BiCollection} />
      </Container>
    );
  }

  return (
    <Container p="xs" size="xl">
      <Stack>
        <InfiniteScroll
          dataLength={collections.length}
          hasMore={!!hasNextPage}
          isInitialLoading={false}
          isLoading={isFetchingNextPage}
          loadMore={fetchNextPage}
        >
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </SimpleGrid>
        </InfiniteScroll>
      </Stack>

      <CreateCollectionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </Container>
  );
}
