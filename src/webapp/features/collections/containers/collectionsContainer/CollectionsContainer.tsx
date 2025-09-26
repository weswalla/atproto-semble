'use client';

import {
  Button,
  Container,
  Stack,
  Text,
  SimpleGrid,
  Center,
} from '@mantine/core';
import useCollections from '../../lib/queries/useCollections';
import CollectionCard from '../../components/collectionCard/CollectionCard';
import CreateCollectionDrawer from '../../components/createCollectionDrawer/CreateCollectionDrawer';
import { useState } from 'react';
import ProfileEmptyTab from '@/features/profile/components/profileEmptyTab/ProfileEmptyTab';
import { BiCollection } from 'react-icons/bi';

export default function CollectionsContainer() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCollections();

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
        <Stack>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </SimpleGrid>

          {hasNextPage && (
            <Center>
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                loading={isFetchingNextPage}
                variant="light"
                color="gray"
                mt="md"
              >
                Load More
              </Button>
            </Center>
          )}
        </Stack>
      </Stack>

      <CreateCollectionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </Container>
  );
}
