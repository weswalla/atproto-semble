import { Anchor, Avatar, Group, Paper, Stack, Text } from '@mantine/core';
import { FeedItem, Collection } from '@/api-client';
import { Fragment } from 'react';
import Link from 'next/link';
import { getRelativeTime } from '@/lib/utils/time';
import { getRecordKey } from '@/lib/utils/atproto';

interface Props {
  user: FeedItem['user'];
  collections?: FeedItem['collections'];
  createdAt: Date;
}

export default function FeedActivityStatus(props: Props) {
  const MAX_DISPLAYED = 2;
  const time = getRelativeTime(props.createdAt.toString());
  const relativeCreatedDate = time === 'just now' ? `Now` : `${time} ago`;

  const renderActivityText = () => {
    const collections = props.collections ?? [];
    const displayedCollections = collections.slice(0, MAX_DISPLAYED);
    const remainingCount = collections.length - MAX_DISPLAYED;

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
        {collections.length === 0 ? (
          'added to library'
        ) : (
          <Fragment>
            added to{' '}
            {displayedCollections.map((collection: Collection, index: number) => (
              <span key={collection.id}>
                <Anchor
                  component={Link}
                  href={`/profile/${collection.author.handle}/collections/${getRecordKey(collection.uri!)}`}
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
          {relativeCreatedDate}
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
