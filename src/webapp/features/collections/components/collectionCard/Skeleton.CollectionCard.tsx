import { Card, Skeleton, Stack } from '@mantine/core';

export default function CollectionCardSkeleton() {
  return (
    <Card withBorder radius={'lg'} p={'sm'}>
      <Stack justify="space-between" h={'100%'}>
        <Stack gap={5}>
          {/* Title */}
          <Skeleton w={'100%'} h={14} />
          {/* Description */}
          <Stack gap={5}>
            <Skeleton w={'100%'} h={14} />
          </Stack>
        </Stack>
        {/* Collection metadata */}
        <Skeleton w={'80%'} h={10} />
      </Stack>
    </Card>
  );
}
