'use client';

import { AppShellAside, Stack, Text } from '@mantine/core';
import CollectionCard from '@/features/collections/components/collectionCard/CollectionCard';
import AddedByCard from '../../components/addedByCard/AddedByCard';
import useSembleLibraries from '../../lib/queries/useSembleLibraries';
import useSembleCollections from '@/features/collections/lib/queries/useSembleCollectionts';

interface Props {
  url: string;
}

export default function SembleAside(props: Props) {
  const { data: libraries } = useSembleLibraries({ url: props.url, limit: 3 });
  const { data: collections } = useSembleCollections({
    url: props.url,
    limit: 3,
  });

  const recentLibraries =
    libraries?.pages.flatMap((page) => page.libraries ?? []) ?? [];
  const recentCollections =
    collections?.pages.flatMap((page) => page.collections ?? []) ?? [];

  return (
    <AppShellAside p={'sm'} style={{ overflow: 'scroll' }}>
      <Stack gap={'xl'}>
        <Stack gap={'xs'}>
          <Text fz={'xl'} fw={600}>
            Added recently by
          </Text>
          {recentLibraries.length === 0 ? (
            <Text c={'gray'} fw={600}>
              No one has added this to their library... yet
            </Text>
          ) : (
            <Stack gap={'xs'}>
              {recentLibraries.slice(0, 3).map((lib) => (
                <AddedByCard key={lib.card.id} item={lib} />
              ))}
            </Stack>
          )}
        </Stack>

        <Stack gap={'xs'}>
          <Text fz={'xl'} fw={600}>
            Recent collections
          </Text>
          {recentCollections.length === 0 ? (
            <Text c={'gray'} fw={600}>
              No one has added this to their collections... yet
            </Text>
          ) : (
            <Stack gap={'xs'}>
              {recentCollections.slice(0, 3).map((col) => (
                <CollectionCard
                  key={col.uri}
                  collection={col}
                  showAuthor={true}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>
    </AppShellAside>
  );
}
