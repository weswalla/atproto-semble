'use client';

import useMyFeed from '@/features/feeds/lib/queries/useMyFeed';
import FeedItem from '@/features/feeds/components/feedItem/FeedItem';
import { Button, Stack, Title, Text, Center, Container } from '@mantine/core';
import MyFeedContainerSkeleton from './Skeleton.MyFeedContainer';
import MyFeedContainerError from './Error.MyFeedContainer';

export default function MyFeedContainer() {
  const {
    data,
    error,
    isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyFeed();

  const allActivities =
    data?.pages.flatMap((page) => page.activities ?? []) ?? [];

  if (isPending) {
    return <MyFeedContainerSkeleton />;
  }

  if (error) {
    return <MyFeedContainerError />;
  }

  return (
    <Container p="xs" size="xl">
      <Stack>
        <Title order={2}>Explore</Title>

        {allActivities.length === 0 ? (
          <Center h={200}>
            <Text c="dimmed">No activity to show yet</Text>
          </Center>
        ) : (
          <Stack gap="xl">
            {allActivities.map((item) => (
              <FeedItem key={item.id} item={item} />
            ))}

            {hasNextPage && (
              <Center>
                <Button
                  onClick={() => fetchNextPage()}
                  loading={isFetchingNextPage}
                  variant="light"
                  color="gray"
                >
                  Load More
                </Button>
              </Center>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
