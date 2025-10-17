'use client';

import useSembleNotes from '@/features/notes/lib/queries/useSembleNotes';
import InfiniteScroll from '@/components/contentDisplay/infiniteScroll/InfiniteScroll';
import { Center, Grid, Loader } from '@mantine/core';
import SembleNotesContainerError from './Error.SembleNotesContainer';
import NoteCard from '@/features/notes/components/noteCard/NoteCard';
import SembleEmptyTab from '../../components/sembleEmptyTab/SembleEmptyTab';
import { FaRegNoteSticky } from 'react-icons/fa6';
import { useNavbarContext } from '@/providers/navbar';

interface Props {
  url: string;
}

export default function SembleNotesContainer(props: Props) {
  const { desktopOpened } = useNavbarContext();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
  } = useSembleNotes({ url: props.url });

  const allNotes = data?.pages.flatMap((page) => page.notes ?? []) ?? [];

  if (error) {
    return <SembleNotesContainerError />;
  }

  if (allNotes.length === 0) {
    return <SembleEmptyTab message="No notes" icon={FaRegNoteSticky} />;
  }

  return (
    <InfiniteScroll
      dataLength={allNotes.length}
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
        {allNotes.map((note) => (
          <Grid.Col
            key={note.id}
            span={{
              base: 12,
              xs: desktopOpened ? 12 : 6,
              sm: desktopOpened ? 6 : 4,
              md: 4,
              lg: 3,
            }}
          >
            <NoteCard
              id={note.id}
              authorId={note.authorId}
              createdAt={note.createdAt}
              note={note.note}
            />
          </Grid.Col>
        ))}
      </Grid>
    </InfiniteScroll>
  );
}
