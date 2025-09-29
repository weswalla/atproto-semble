import { Anchor, Avatar, Group, Paper, Stack, Text } from '@mantine/core';
import { FeedItem } from '@/api-client/types';
import { Fragment } from 'react';
import Link from 'next/link';

interface Props {
  user: FeedItem['user'];
  collections: FeedItem['collections'];
}

export default function FeedActivityStatus(props: Props) {
  const MAX_DISPLAYED = 2;

  const renderActivityText = () => {
    const displayedCollections = props.collections.slice(0, MAX_DISPLAYED);
    const remainingCount = props.collections.length - MAX_DISPLAYED;

    return (
      <Text fw={500} c={'gray.7'}>
        <Anchor
          component={Link}
          href={`/profile/${props.user.handle}`}
          c="blue"
          fw={600}
        >
          {props.user.name}
        </Anchor>{' '}
        {props.collections.length === 0 ? (
          'added to library'
        ) : (
          <Fragment>
            added to{' '}
            {displayedCollections.map((collection, index) => (
              <span key={collection.id}>
                {/* TODO: use collection creator's handle to direct to profile/creatorHandle/collections/id */}
                <Anchor
                  component={Link}
                  href={`/profile/${props.user.handle}/collections/${collection.id}`}
                  c="grape"
                  fw={500}
                >
                  {collection.name}
                </Anchor>

                {index < displayedCollections.length - 1 ? ', ' : ''}
              </span>
            ))}
            {remainingCount > 0 &&
              ` and ${remainingCount} other collection${remainingCount > 1 ? 's' : ''}`}
          </Fragment>
        )}
        <Text fz={'sm'} fw={600} c={'gray'} span display={'block'}>
          Timestamp
        </Text>
      </Text>
    );
  };

  return (
    <Paper bg={'gray.1'} radius={'lg'}>
      <Stack gap={'xs'}>
        <Group gap={'xs'} wrap="nowrap" align="center" p={'xs'}>
          <Avatar
            component={Link}
            href={`/profile/${props.user.handle}`}
            src={props.user.avatarUrl}
            alt={`${props.user.name}'s' avatar`}
          />
          {renderActivityText()}
        </Group>
      </Stack>
    </Paper>
  );
}
