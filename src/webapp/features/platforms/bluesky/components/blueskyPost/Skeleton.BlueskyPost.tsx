import { Stack, Group, Avatar, Skeleton } from '@mantine/core';

export default function BlueskyPostSkeleton() {
  return (
    <Stack justify="space-between" align="start" gap="xs">
      <Group gap="xs" w={'100%'}>
        <Avatar radius="xl" />
        <Stack gap={5} flex={1}>
          <Skeleton w={'70%'} h={14} />
          <Skeleton w={'100%'} h={14} />
        </Stack>
      </Group>
      <Stack w={'100%'} gap={5}>
        <Skeleton w={'100%'} h={10} />
        <Skeleton w={'100%'} h={10} />
        <Skeleton w={'100%'} h={10} />
      </Stack>
    </Stack>
  );
}
