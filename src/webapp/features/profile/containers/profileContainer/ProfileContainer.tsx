'use client';

import UrlCard from '@/features/cards/components/urlCard/UrlCard';
import useMyCards from '@/features/cards/lib/queries/useMyCards';
import CollectionCard from '@/features/collections/components/collectionCard/CollectionCard';
import useCollections from '@/features/collections/lib/queries/useCollections';
import {
  Anchor,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Title,
  Grid,
} from '@mantine/core';
import Link from 'next/link';
import ProfileEmptyTab from '../../components/profileEmptyTab/ProfileEmptyTab';
import { BiCollection } from 'react-icons/bi';
import { FaRegNoteSticky } from 'react-icons/fa6';

interface Props {
  handle: string;
}

export default function ProfileContainer(props: Props) {
  // TODO: use profile endpoints to fetch profile information
  // for now we'll use getMyProfile
  const { data: collectionsData } = useCollections({ limit: 4 });
  const { data: myCardsData } = useMyCards({ limit: 4 });

  const collections =
    collectionsData?.pages.flatMap((page) => page.collections) ?? [];
  const cards = myCardsData?.pages.flatMap((page) => page.cards) ?? [];

  return (
    <Container p={'xs'} size={'xl'}>
      <Stack>
        <Stack gap={50}>
          {/* Cards */}
          <Stack>
            <Group justify="space-between">
              <Title order={2} fz={'h3'}>
                Cards
              </Title>
              <Anchor
                component={Link}
                href={`/profile/${props.handle}/cards`}
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
              <ProfileEmptyTab message="No cards" icon={FaRegNoteSticky} />
            )}
          </Stack>

          {/* Collections */}
          <Stack>
            <Group justify="space-between">
              <Title order={2} fz={'h3'}>
                Collections
              </Title>
              <Anchor
                component={Link}
                href={`/profile/${props.handle}/collections`}
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
              <ProfileEmptyTab message="No collections" icon={BiCollection} />
            )}
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
}
