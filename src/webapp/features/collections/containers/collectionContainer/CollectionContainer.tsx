'use client';

import {
  Anchor,
  Box,
  Button,
  Container,
  Grid,
  Group,
  Stack,
  Text,
  Title,
  Avatar,
} from '@mantine/core';
import useCollection from '../../lib/queries/useCollection';
import UrlCard from '@/features/cards/components/urlCard/UrlCard';
import Link from 'next/link';
import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import AddCardDrawer from '@/features/cards/components/addCardDrawer/AddCardDrawer';
import CollectionActions from '../../components/collectionActions/CollectionActions';
import CollectionContainerError from './Error.CollectionContainer';
import CollectionContainerSkeleton from './Skeleton.CollectionContainer';
import InfiniteScroll from '@/components/contentDisplay/infiniteScroll/InfiniteScroll';

interface Props {
  rkey: string;
  handle: string;
}

export default function CollectionContainer(props: Props) {
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const {
    data,
    isPending,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCollection({ rkey: props.rkey, handle: props.handle });

  const firstPage = data.pages[0];
  const allCards = data.pages.flatMap((page) => page.urlCards ?? []);

  if (isPending) {
    return <CollectionContainerSkeleton />;
  }

  if (error) {
    return <CollectionContainerError />;
  }

  return (
    <Container p="xs" size="xl">
      <Stack justify="flex-start">
        <Group justify="space-between" align="start">
          <Stack gap={0}>
            <Text fw={700} c="grape">
              Collection
            </Text>
            <Title order={1}>{firstPage.name}</Title>
            {firstPage.description && (
              <Text c="gray" mt="lg">
                {firstPage.description}
              </Text>
            )}
          </Stack>

          <Group gap={'xs'}>
            <Text fw={600} c="gray">
              By
            </Text>
            <Group gap={5}>
              <Avatar
                size={'sm'}
                component={Link}
                href={`/profile/${firstPage.author.handle}`}
                src={firstPage.author.avatarUrl}
                alt={`${firstPage.author.name}'s' avatar`}
              />
              <Anchor
                component={Link}
                href={`/profile/${firstPage.author.handle}`}
                fw={700}
                c="blue"
              >
                {firstPage.author.name}
              </Anchor>
            </Group>
          </Group>
        </Group>

        <Group justify="end">
          <CollectionActions
            id={firstPage.id}
            rkey={props.rkey}
            name={firstPage.name}
            description={firstPage.description}
            authorHandle={firstPage.author.handle}
          />
        </Group>

        {allCards.length > 0 ? (
          <InfiniteScroll
            dataLength={allCards.length}
            hasMore={!!hasNextPage}
            isInitialLoading={isPending}
            isLoading={isFetchingNextPage}
            loadMore={fetchNextPage}
          >
            <Grid gutter="md">
              {allCards.map((card) => (
                <Grid.Col
                  key={card.id}
                  span={{ base: 12, xs: 6, sm: 4, lg: 3 }}
                >
                  <UrlCard
                    id={card.id}
                    url={card.url}
                    cardContent={card.cardContent}
                    authorHandle={firstPage.author.handle}
                    cardAuthor={firstPage.author}
                    note={card.note}
                    urlLibraryCount={card.urlLibraryCount}
                    urlIsInLibrary={card.urlInLibrary}
                    currentCollection={firstPage}
                  />
                </Grid.Col>
              ))}
            </Grid>
          </InfiniteScroll>
        ) : (
          <Stack align="center" gap="xs">
            <Text fz="h3" fw={600} c="gray">
              No cards
            </Text>
            <Button
              variant="light"
              color="gray"
              size="md"
              rightSection={<FiPlus size={22} />}
              onClick={() => setShowAddDrawer(true)}
            >
              Add your first card
            </Button>
          </Stack>
        )}
      </Stack>

      <Box>
        <AddCardDrawer
          isOpen={showAddDrawer}
          onClose={() => setShowAddDrawer(false)}
          selectedCollection={{
            id: firstPage.id,
            name: firstPage.name,
            cardCount: allCards.length,
          }}
        />
      </Box>
    </Container>
  );
}
