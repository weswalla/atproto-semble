import { Stack, Skeleton, Text } from '@mantine/core';

export default function UrlMetadataHeaderSkeleton() {
  return (
    <Stack>
      <Stack gap={0}>
        <Text fw={700} c="tangerine" span>
          Semble
        </Text>

        {/* Title */}
        <Skeleton w={'100%'} h={27} />
      </Stack>

      {/* Description */}
      <Stack gap={5}>
        <Skeleton w={'80%'} h={22} />
        <Skeleton w={'80%'} h={22} />
        <Skeleton w={'80%'} h={22} />
      </Stack>
    </Stack>
  );
}
