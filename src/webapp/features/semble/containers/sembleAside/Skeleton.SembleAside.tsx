import CollectionCardSkeleton from '@/features/collections/components/collectionCard/Skeleton.CollectionCard';
import { AppShellAside, Stack, Text } from '@mantine/core';
import AddedByCardSkeleton from '../../components/addedByCard/Skeleton.AddedByCard';

export default function SembleAsideSkeleton() {
  return (
    <AppShellAside p={'sm'}>
      <Stack gap={'xl'}>
        <Stack gap={'xs'}>
          <Text fz={'xl'} fw={600}>
            Added recently by
          </Text>
          <Stack gap={'xs'}>
            <AddedByCardSkeleton />
            <AddedByCardSkeleton />
          </Stack>
        </Stack>

        <Stack gap={'xs'}>
          <Text fz={'xl'} fw={600}>
            Recent collections
          </Text>
          <CollectionCardSkeleton />
          <CollectionCardSkeleton />
        </Stack>
      </Stack>
    </AppShellAside>
  );
}
