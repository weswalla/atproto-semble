import { Stack, Group, Avatar, Skeleton } from '@mantine/core';
import { FaBluesky } from 'react-icons/fa6';

export default function BlueskyPostSkeleton() {
  return (
    <Stack justify="space-between" gap="xs">
      <Group gap="xs" justify="space-between" wrap="nowrap" w={'100%'}>
        <Group gap={'xs'} wrap="nowrap" w={'100%'}>
          <Avatar size={'sm'} radius="xl" />
          <Skeleton w={'70%'} h={14} />
        </Group>

        <FaBluesky size={18} fill="#0085ff" />
      </Group>
      <Stack w={'100%'} gap={5}>
        <Skeleton w={'100%'} h={10} />
        <Skeleton w={'100%'} h={10} />
        <Skeleton w={'100%'} h={10} />
      </Stack>
    </Stack>
  );
}
