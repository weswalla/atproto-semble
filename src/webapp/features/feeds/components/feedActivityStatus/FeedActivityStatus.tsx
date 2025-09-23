import { Anchor, Avatar, Box, Group, Text } from '@mantine/core';
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
      <Text c={'gray'} fw={500}>
        <Anchor
          component={Link}
          href={`/profile/${props.user.handle}`}
          c="blue"
          fw={600}
        >
          @{props.user.handle}
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

                {index < displayedCollections.length - 1 ? ' and ' : ''}
              </span>
            ))}
            {remainingCount > 0 &&
              ` and ${remainingCount} other${remainingCount > 1 ? 's' : ''}`}
          </Fragment>
        )}
      </Text>
    );
  };

  return (
    <Group gap={'xs'}>
      <Avatar
        component={Link}
        href={`/profile/${props.user.handle}`}
        src={props.user.avatarUrl}
        alt={`${props.user.name}'s' avatar`}
      />
      {renderActivityText()}
    </Group>
  );
}
