import UrlCardSkeleton from '@/features/cards/components/urlCard/Skeleton.UrlCard';
import { Avatar, Group, Paper, Skeleton, Stack } from '@mantine/core';

export default function FeedItemSkeleton() {
  return (
    <Stack gap={'xs'} align="stretch">
      {/* Feed activity status*/}
      <Paper bg={'gray.1'} radius={'lg'}>
        <Stack gap={'xs'} align="stretch" w={'100%'}>
          <Group gap={'xs'} wrap="nowrap" align="center" p={'xs'}>
            <Avatar />
            <Stack gap={'sm'} align="stretch" w={'100%'}>
              <Skeleton w={'100%'} h={21} />
              <Skeleton w={'20%'} h={13} />
            </Stack>
          </Group>
        </Stack>
      </Paper>

      <UrlCardSkeleton />
    </Stack>
  );
}
