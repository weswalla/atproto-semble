'use client';

import {
  Button,
  Container,
  Stack,
  Title,
  Text,
  SimpleGrid,
  Center,
} from '@mantine/core';
import useCollections from '../../lib/queries/useCollections';
import { BiPlus } from 'react-icons/bi';
import CollectionCard from '../../components/collectionCard/CollectionCard';
import { useState } from 'react';
import CreateCollectionDrawer from '../../components/createCollectionDrawer/CreateCollectionDrawer';

export default function CollectionsContainer() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCollections();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const collections =
    data?.pages.flatMap((page) => page.collections ?? []) ?? [];

  return (
    <Container p="xs" size="xl">
      <Stack>
        <Title order={1}>Collections</Title>

        {collections.length > 0 ? (
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
        ) : (
          <Stack align="center" gap="xs">
            <Text fz="h3" fw={600} c="gray">
              No collections
            </Text>
            <Button
              onClick={() => setIsDrawerOpen(true)}
              variant="light"
              color="gray"
              size="md"
              rightSection={<BiPlus size={22} />}
            >
              Create your first collection
            </Button>
          </Stack>
        )}
      </Stack>

      <CreateCollectionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </Container>
  );
}
