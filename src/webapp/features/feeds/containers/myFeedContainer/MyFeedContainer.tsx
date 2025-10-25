'use client';

import useMyFeed from '@/features/feeds/lib/queries/useMyFeed';
import FeedItem from '@/features/feeds/components/feedItem/FeedItem';
import { Stack, Title, Text, Center, Container } from '@mantine/core';
import MyFeedContainerSkeleton from './Skeleton.MyFeedContainer';
import MyFeedContainerError from './Error.MyFeedContainer';
import InfiniteScroll from '@/components/contentDisplay/infiniteScroll/InfiniteScroll';

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
        <Title order={1}>Explore</Title>

        {allActivities.length === 0 ? (
          <Center h={200}>
            <Text fz="h3" fw={600} c="gray">
              No activity to show yet
            </Text>
          </Center>
        ) : (
          <InfiniteScroll
            dataLength={allActivities.length}
            hasMore={!!hasNextPage}
            isInitialLoading={isPending}
            isLoading={isFetchingNextPage}
            loadMore={fetchNextPage}
          >
            <Stack gap={'xl'} mx={'auto'} maw={600}>
              <Stack gap={60}>
                {allActivities.map((item) => (
                  <FeedItem key={item.id} item={item} />
                ))}
              </Stack>
            </Stack>
          </InfiniteScroll>
        )}
      </Stack>
    </Container>
  );
}
