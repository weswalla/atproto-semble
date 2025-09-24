'use client';

import { Container, Grid, Stack, Button, Text, Center } from '@mantine/core';
import useMyCards from '../../lib/queries/useMyCards';
import UrlCard from '@/features/cards/components/urlCard/UrlCard';
import AddCardDrawer from '../../components/addCardDrawer/AddCardDrawer';
import MyCardsContainerError from './Error.MyCardsContainer';
import MyCardsContainerSkeleton from './Skeleton.MyCardsContainer';
import { Fragment, useState } from 'react';

export default function MyCardsContainer() {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
  } = useMyCards();

  const [showAddDrawer, setShowAddDrawer] = useState(false);

  const allCards = data?.pages.flatMap((page) => page.cards ?? []) ?? [];

  if (isPending) {
    return <MyCardsContainerSkeleton />;
  }

  if (error) {
    return <MyCardsContainerError />;
  }

  return (
    <Container p="xs" size="xl">
      <Stack>
        {allCards.length > 0 ? (
          <Fragment>
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
                    note={card.note}
                    collections={card.collections}
                  />
                </Grid.Col>
              ))}
            </Grid>

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
          </Fragment>
        ) : (
          <Stack align="center" gap="xs">
            <Text fz="h3" fw={600} c="gray">
              No cards
            </Text>
            <AddCardDrawer
              isOpen={showAddDrawer}
              onClose={() => setShowAddDrawer(false)}
            />
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
