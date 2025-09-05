import { Loader, Skeleton, Stack } from '@mantine/core';

export default function CollectionSelectorSkeleton() {
  return (
    <Stack gap={'xs'}>
      <Skeleton w={'100%'} h={50} />
      <Skeleton w={'100%'} h={50} />
      <Skeleton w={'100%'} h={50} />
      <Skeleton w={'100%'} h={50} />
      <Skeleton w={'100%'} h={50} />
    </Stack>
  );
}
