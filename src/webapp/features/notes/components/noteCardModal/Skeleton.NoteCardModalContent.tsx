import { Avatar, Group, Skeleton, Stack } from '@mantine/core';

export default function NoteCardModalContentSkeleton() {
  return (
    <Stack gap={'xs'}>
      <Group gap={5}>
        <Avatar size={'sm'} />
        <Skeleton w={100} h={14} />
      </Group>
      {/* Note */}
      <Skeleton w={'100%'} h={14} />
      <Skeleton w={'100%'} h={14} />

      <Skeleton w={'100%'} h={72} radius={'lg'} />
    </Stack>
  );
}
