import { AppShellAside, Stack, Text } from '@mantine/core';
import { getLibrariesForUrl } from '../../lib/dal';
import { getCollectionsForUrl } from '@/features/collections/lib/dal';
import CollectionCard from '@/features/collections/components/collectionCard/CollectionCard';
import AddedByCard from '../../components/addedByCard/AddedByCard';

interface Props {
  url: string;
}

export default async function SembleAside(props: Props) {
  const { libraries } = await getLibrariesForUrl(props.url);
  const collectionsData = await getCollectionsForUrl(props.url);

  return (
    <AppShellAside p={'sm'} style={{ overflow: 'scroll' }}>
      <Stack gap={'xl'}>
        <Stack gap={'xs'}>
          <Text fz={'xl'} fw={600}>
            Added recently by
          </Text>
          {libraries.length === 0 ? (
            <Text c={'gray'} fw={600}>
              No one has added this to their library... yet
            </Text>
          ) : (
            <Stack gap={'xs'}>
              {libraries.slice(0, 3).map((lib) => (
                <AddedByCard key={lib.card.id} item={lib} />
              ))}
            </Stack>
          )}
        </Stack>

        <Stack gap={'xs'}>
          <Text fz={'xl'} fw={600}>
            Recent collections
          </Text>
          {collectionsData.collections.length === 0 ? (
            <Text c={'gray'} fw={600}>
              No one has added this to their collections... yet
            </Text>
          ) : (
            <Stack gap={'xs'}>
              {collectionsData.collections.slice(0, 3).map((col) => (
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
