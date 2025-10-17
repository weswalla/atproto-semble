'use client';

import UrlCard from '@/features/cards/components/urlCard/UrlCard';
import useMyCards from '@/features/cards/lib/queries/useMyCards';
import CollectionCard from '@/features/collections/components/collectionCard/CollectionCard';
import useMyCollections from '@/features/collections/lib/queries/useMyCollections';
import CreateCollectionDrawer from '@/features/collections/components/createCollectionDrawer/CreateCollectionDrawer';
import {
  Anchor,
  Container,
  Grid,
  Group,
  SimpleGrid,
  Stack,
  Title,
  Text,
  Button,
} from '@mantine/core';
import Link from 'next/link';
import { useState } from 'react';
import { BiCollection, BiPlus } from 'react-icons/bi';
import { FaRegNoteSticky } from 'react-icons/fa6';
import AddCardDrawer from '@/features/cards/components/addCardDrawer/AddCardDrawer';
import useMyProfile from '@/features/profile/lib/queries/useMyProfile';
import { useNavbarContext } from '@/providers/navbar';

export default function HomeContainer() {
  const { data: collectionsData } = useMyCollections({ limit: 4 });
  const { data: myCardsData } = useMyCards({ limit: 4 });
  const { data: profile } = useMyProfile();

  const { desktopOpened } = useNavbarContext();
  const [showCollectionDrawer, setShowCollectionDrawer] = useState(false);
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  const collections =
    collectionsData?.pages.flatMap((page) => page.collections) ?? [];
  const cards = myCardsData?.pages.flatMap((page) => page.cards) ?? [];

  return (
    <Container p="xs" size="xl">
      <Stack gap="xl">
        <Title order={1}>Home</Title>

        <Stack gap={50}>
          {/* Collections */}
          <Stack>
            <Group justify="space-between">
              <Group gap="xs">
                <BiCollection size={22} />
                <Title order={2}>Collections</Title>
              </Group>
              <Anchor
                component={Link}
                href={`/profile/${profile.handle}/collections`}
                c="blue"
                fw={600}
              >
                View all
              </Anchor>
            </Group>

            {collections.length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
                {collections.map((collection) => (
                  <CollectionCard key={collection.id} collection={collection} />
                ))}
              </SimpleGrid>
            ) : (
              <Stack align="center" gap="xs">
                <Text fz="h3" fw={600} c="gray">
                  No collections
                </Text>
                <Button
                  onClick={() => setShowCollectionDrawer(true)}
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

          {/* Cards */}
          <Stack>
            <Group justify="space-between">
              <Group gap="xs">
                <FaRegNoteSticky size={22} />
                <Title order={2}>Cards</Title>
              </Group>
              <Anchor
                component={Link}
                href={`/profile/${profile.handle}/cards`}
                c="blue"
                fw={600}
              >
                View all
              </Anchor>
            </Group>

            {cards.length > 0 ? (
              <Grid gutter="md">
                {cards.map((card) => (
                  <Grid.Col
                    key={card.id}
                    span={{
                      base: 12,
                      xs: desktopOpened ? 12 : 6,
                      sm: desktopOpened ? 6 : 4,
                      md: 4,
                      lg: 3,
                    }}
                  >
                    <UrlCard
                      id={card.id}
                      url={card.url}
                      cardContent={card.cardContent}
                      note={card.note}
                      collections={card.collections}
                      urlLibraryCount={card.urlLibraryCount}
                    />
                  </Grid.Col>
                ))}
              </Grid>
            ) : (
              <Stack align="center" gap="xs">
                <Text fz="h3" fw={600} c="gray">
                  No cards
                </Text>
                <Button
                  variant="light"
                  color="gray"
                  size="md"
                  rightSection={<BiPlus size={22} />}
                  onClick={() => setShowAddDrawer(true)}
                >
                  Add your first card
                </Button>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>

      {/* Drawers */}
      <CreateCollectionDrawer
        isOpen={showCollectionDrawer}
        onClose={() => setShowCollectionDrawer(false)}
      />
      <AddCardDrawer
        isOpen={showAddDrawer}
        onClose={() => setShowAddDrawer(false)}
      />
    </Container>
  );
}
