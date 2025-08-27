'use client';

import UrlCard from '@/features/cards/components/urlCard/UrlCard';
import useMyCards from '@/features/cards/lib/queries/useMyCards';
import CollectionCard from '@/features/collections/components/collectionCard/CollectionCard';
import useCollections from '@/features/collections/lib/queries/useCollections';
import { useContextDrawers } from '@/providers/drawers';
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
import { BiCollection, BiPlus } from 'react-icons/bi';
import { FaRegNoteSticky } from 'react-icons/fa6';

export default function LibraryContainer() {
  const { data: CollectionsData } = useCollections({ limit: 4 });
  const { data: myCardsData } = useMyCards({ limit: 4 });

  return (
    <Container p={'xs'} size={'xl'}>
      <Stack gap={'xl'}>
        <Title order={1}>Library</Title>

        <Stack gap={50}>
          <Stack>
            <Group justify="space-between">
              <Group gap={'xs'}>
                <BiCollection size={22} />
                <Title order={2}>Collections</Title>
              </Group>
              <Anchor component={Link} href={'/collections'} c="blue" fw={600}>
                View all
              </Anchor>
            </Group>

            {CollectionsData.collections.length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={'md'}>
                {CollectionsData.collections.map((c) => (
                  <CollectionCard key={c.id} collection={c} />
                ))}
              </SimpleGrid>
            ) : (
              <Stack align="center" gap={'xs'}>
                <Text fz={'h3'} fw={600} c={'gray'}>
                  No collections
                </Text>
                <Button
                  onClick={() => drawers.open({ drawer: 'createCollection' })}
                  variant="light"
                  color={'gray'}
                  size="md"
                  rightSection={<BiPlus size={22} />}
                >
                  Create your first collection
                </Button>
              </Stack>
            )}
          </Stack>

          <Stack>
            <Group justify="space-between">
              <Group gap={'xs'}>
                <FaRegNoteSticky size={22} />
                <Title order={2}>My Cards</Title>
              </Group>
              <Anchor component={Link} href={'/my-cards'} c="blue" fw={600}>
                View all
              </Anchor>
            </Group>
            {myCardsData.cards.length > 0 ? (
              <Grid gutter={'md'}>
                {myCardsData.cards.map((card) => (
                  <Grid.Col
                    key={card.id}
                    span={{ base: 12, xs: 6, sm: 4, lg: 3 }}
                  >
                    <UrlCard
                      id={card.id}
                      url={card.url}
                      cardContent={card.cardContent}
                      note={card.note}
                      collections={card.collections}
                    />
                  </Grid.Col>
                ))}
              </Grid>
            ) : (
              <Stack align="center" gap={'xs'}>
                <Text fz={'h3'} fw={600} c={'gray'}>
                  No cards
                </Text>
                <Button
                  component={Link}
                  href={'/cards/add'}
                  variant="light"
                  color={'gray'}
                  size="md"
                  rightSection={<BiPlus size={22} />}
                >
                  Add your first card
                </Button>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
}
