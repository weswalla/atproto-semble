import CollectionCardSkeleton from '@/features/collections/components/collectionCard/Skeleton.CollectionCard';
import {
  AppShellAside,
  Stack,
  Card,
  Group,
  Avatar,
  Text,
  Skeleton,
} from '@mantine/core';

export default function SembleAsideSkeleton() {
  return (
    <AppShellAside p={'sm'}>
      <Stack gap={'xl'}>
        <Stack gap={'xs'}>
          <Text fz={'xl'} fw={600}>
            Added recently by
          </Text>
          <Stack gap={'xs'}>
            <Card withBorder radius={'lg'} p={'sm'}>
              <Group gap={'xs'}>
                <Avatar src={null} />
                <Stack gap={'xs'} flex={1}>
                  <Skeleton w={'100%'} h={14} />
                  <Skeleton w={'100%'} h={14} />
                </Stack>
              </Group>
            </Card>
          </Stack>
        </Stack>

        <Stack gap={'xs'}>
          <Text fz={'xl'} fw={600}>
            Recent collections
          </Text>
          <CollectionCardSkeleton />
        </Stack>
      </Stack>
    </AppShellAside>
  );
}
