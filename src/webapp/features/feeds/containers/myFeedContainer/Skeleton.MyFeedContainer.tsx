import { Container, Stack, Title } from '@mantine/core';
import FeedItemSkeleton from '../../components/feedItem/Skeleton.FeedItem';

export default function MyFeedContainerSkeleton() {
  return (
    <Container p="xs" size="xl">
      <Stack>
        <Title order={2}>Explore</Title>

        <Stack gap={'xl'}>
          {Array.from({ length: 4 }).map((_, i) => (
            <FeedItemSkeleton key={i} />
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}
