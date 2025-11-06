import { AppShellAside, Avatar, Card, Group, Stack, Text } from '@mantine/core';
import { getLibrariesForUrl } from '../../lib/dal';
import { getCollectionsForUrl } from '@/features/collections/lib/dal';
import Link from 'next/link';
import CollectionCard from '@/features/collections/components/collectionCard/CollectionCard';

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
                <Card
                  key={lib.card.id}
                  withBorder
                  component={Link}
                  href={`/profile/${lib.user.handle}`}
                  radius={'lg'}
                  p={'sm'}
                  style={{ cursor: 'pointer' }}
                >
                  <Group gap={'xs'}>
                    <Avatar
                      src={lib.user.avatarUrl}
                      alt={`${lib.user.name}'s avatar`}
                    />
                    <Stack gap={0}>
                      <Text
                        fw={600}
                        lineClamp={1}
                        c={'var(--mantine-color-bright)'}
                      >
                        {lib.user.name}
                      </Text>
                      <Text fw={600} c={'blue'} lineClamp={1}>
                        @{lib.user.handle}
                      </Text>
                    </Stack>
                  </Group>
                </Card>
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
