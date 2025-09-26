'use client';

import { Container, Grid, Stack, Button, Text, Center } from '@mantine/core';
import useCards from '../../lib/queries/useCards';
import UrlCard from '@/features/cards/components/urlCard/UrlCard';
import CardsContainerError from './Error.CardsContainer';
import CardsContainerSkeleton from './Skeleton.CardsContainer';
import { Fragment, useState } from 'react';
import ProfileEmptyTab from '@/features/profile/components/profileEmptyTab/ProfileEmptyTab';
import { FaRegNoteSticky } from 'react-icons/fa6';

interface Props {
  handle: string;
}

export default function CardsContainer(props: Props) {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
  } = useCards({ didOrHandle: props.handle });

  const allCards = data?.pages.flatMap((page) => page.cards ?? []) ?? [];

  if (isPending) {
    return <CardsContainerSkeleton />;
  }

  if (error) {
    return <CardsContainerError />;
  }

  if (allCards.length === 0) {
    return (
      <Container px="xs" py={'xl'} size="xl">
        <ProfileEmptyTab message="No cards" icon={FaRegNoteSticky} />
      </Container>
    );
  }

  return (
    <Container p="xs" size="xl">
      <Stack>
        <Fragment>
          <Grid gutter="md">
            {allCards.map((card) => (
              <Grid.Col key={card.id} span={{ base: 12, xs: 6, sm: 4, lg: 3 }}>
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
      </Stack>
    </Container>
  );
}
