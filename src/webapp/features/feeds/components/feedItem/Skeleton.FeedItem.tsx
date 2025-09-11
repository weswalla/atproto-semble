import UrlCardSkeleton from '@/features/cards/components/urlCard/Skeleton.UrlCard';
import { Avatar, Group, Skeleton, Stack } from '@mantine/core';

export default function FeedItemSkeleton() {
  return (
    <Stack gap={'xs'}>
      {/* Feed activity status*/}
      <Group gap={'xs'} wrap="nowrap">
        <Avatar />
        <Skeleton w={'60%'} h={14} />
      </Group>

      <UrlCardSkeleton />
    </Stack>
  );
}
