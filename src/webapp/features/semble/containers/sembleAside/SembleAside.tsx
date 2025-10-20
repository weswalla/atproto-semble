import { AppShellAside, Stack, Text } from '@mantine/core';
import { getLibrariesForUrl } from '../../lib/dal';
import { getCollectionsForUrl } from '@/features/collections/lib/dal';
import { Fragment } from 'react';

interface Props {
  url: string;
}

export default async function SembleAside(props: Props) {
  const { libraries } = await getLibrariesForUrl(props.url);
  const { collections } = await getCollectionsForUrl(props.url);

  return (
    <AppShellAside p={'xs'}>
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
            <Fragment>
              {libraries.map((lib) => (
                <div key={lib.userId}>{lib.userId}</div>
              ))}
            </Fragment>
          )}
        </Stack>

        <Stack gap={'xs'}>
          <Text fz={'xl'} fw={600}>
            Recent collections
          </Text>
          {collections.length === 0 ? (
            <Text c={'gray'} fw={600}>
              No one has added this to their collections... yet
            </Text>
          ) : (
            <Fragment>
              {collections.map((col) => (
                <div key={col.uri}>{col.name}</div>
              ))}
            </Fragment>
          )}
        </Stack>
      </Stack>
    </AppShellAside>
  );
}
