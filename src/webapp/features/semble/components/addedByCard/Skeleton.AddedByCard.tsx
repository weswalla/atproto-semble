import { Card, Group, Avatar, Stack, Skeleton } from '@mantine/core';

export default function AddedByCardSkeleton() {
  return (
    <Card withBorder radius={'lg'} p={'sm'}>
      <Group gap={'xs'} justify="space-between">
        <Group gap={'xs'} flex={1}>
          <Avatar src={null} />

          <Stack gap={'xs'} flex={1}>
            <Skeleton w={'50%'} h={14} />
            <Skeleton w={'70%'} h={14} />
          </Stack>
        </Group>

        <Skeleton w={'30%'} h={14} />
      </Group>
    </Card>
  );
}
