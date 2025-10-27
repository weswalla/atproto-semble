'use client';

import { Center, Container, Grid, Loader, Stack } from '@mantine/core';
import useCards from '../../lib/queries/useCards';
import UrlCard from '@/features/cards/components/urlCard/UrlCard';
import CardsContainerError from './Error.CardsContainer';
import CardsContainerSkeleton from './Skeleton.CardsContainer';
import ProfileEmptyTab from '@/features/profile/components/profileEmptyTab/ProfileEmptyTab';
import { FaRegNoteSticky } from 'react-icons/fa6';
import InfiniteScroll from '@/components/contentDisplay/infiniteScroll/InfiniteScroll';
import { useNavbarContext } from '@/providers/navbar';

interface Props {
  handle: string;
}

export default function CardsContainer(props: Props) {
  const { desktopOpened } = useNavbarContext();

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
      <InfiniteScroll
        dataLength={allCards.length}
        hasMore={!!hasNextPage}
        isInitialLoading={isPending}
        isLoading={isFetchingNextPage}
        loadMore={fetchNextPage}
        manualLoadButton={false}
        loader={
          <Center>
            <Loader />
          </Center>
        }
      >
        <Grid gutter="md">
          {allCards.map((card) => (
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
                authorHandle={props.handle}
                urlLibraryCount={card.urlLibraryCount}
                urlIsInLibrary={card.urlInLibrary}
              />
            </Grid.Col>
          ))}
        </Grid>
      </InfiniteScroll>
    </Container>
  );
}
