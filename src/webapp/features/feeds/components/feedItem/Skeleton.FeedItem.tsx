'use client';

import UrlCardSkeleton from '@/features/cards/components/urlCard/Skeleton.UrlCard';
import { Avatar, Card, Group, Paper, Skeleton, Stack } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';

export default function FeedItemSkeleton() {
  const colorScheme = useColorScheme();

  return (
    <Stack gap={'xs'} align="stretch">
      {/* Feed activity status*/}
      <Card
        p={0}
        bg={colorScheme === 'dark' ? 'dark.4' : 'gray.1'}
        radius={'lg'}
      >
        <Stack gap={'xs'} align="stretch" w={'100%'}>
          <Group gap={'xs'} wrap="nowrap" align="center" p={'xs'}>
            <Avatar />
            <Stack gap={'sm'} align="stretch" w={'100%'}>
              <Skeleton w={'100%'} h={21} />
              <Skeleton w={'20%'} h={13} />
            </Stack>
          </Group>
        </Stack>
      </Card>

      <UrlCardSkeleton />
    </Stack>
  );
}
