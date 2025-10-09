'use client';

import { Button, Container, Stack, SimpleGrid } from '@mantine/core';
import useCollections from '../../lib/queries/useCollections';
import CollectionCard from '../../components/collectionCard/CollectionCard';
import CreateCollectionDrawer from '../../components/createCollectionDrawer/CreateCollectionDrawer';
import { useState } from 'react';
import ProfileEmptyTab from '@/features/profile/components/profileEmptyTab/ProfileEmptyTab';
import { BiCollection } from 'react-icons/bi';
import InfiniteLoadTrigger from '@/components/contentDisplay/infiniteScroll/InfiniteScroll';

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
        <InfiniteLoadTrigger
          dataLength={collections.length}
          hasMore={!!hasNextPage}
          isInitialLoading={false} // or you can manage initial loading state if needed
          isLoading={isFetchingNextPage}
          loadMore={fetchNextPage}
          manualLoadButton={false} // automatic infinite scroll; set true if you want manual button
          loader={<div>Loading...</div>} // replace with your loader component if you want
        >
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </SimpleGrid>
        </InfiniteLoadTrigger>
      </Stack>

      <CreateCollectionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </Container>
  );
}
