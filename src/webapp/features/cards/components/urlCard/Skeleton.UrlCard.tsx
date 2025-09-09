import { AspectRatio, Card, Group, Skeleton, Stack } from '@mantine/core';

export default function UrlCardSkeleton() {
  return (
    <Stack component="article" gap={5} justify="stretch" h={'100%'}>
      <Card withBorder radius={'lg'} p={'sm'} flex={1}>
        <Stack justify="space-between" gap={'sm'} flex={1}>
          <Group justify="space-between" align="start" gap={'lg'}>
            <Stack gap={'xs'} flex={0.9}>
              <Stack gap={5}>
                {/* Domain */}
                <Skeleton w={80} h={14} />
                {/* Title */}
                <Skeleton w={'100%'} h={14} />
              </Stack>

              {/* Description */}
              <Stack gap={5}>
                <Skeleton w={'100%'} h={10} />
                <Skeleton w={'100%'} h={10} />
                <Skeleton w={'100%'} h={10} />
              </Stack>
            </Stack>

            <AspectRatio ratio={1 / 1} flex={0.1}>
              <Skeleton w={75} h={75} />
            </AspectRatio>
          </Group>

          {/* Url card actions */}

          <Group justify="space-between">
            <Group gap={'xs'}>
              <Skeleton w={22} h={22} />
              <Skeleton w={22} h={22} />
            </Group>
            <Skeleton w={22} h={22} />
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}
