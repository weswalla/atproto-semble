'use client';

import {
  Anchor,
  Avatar,
  Card,
  Group,
  Menu,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core';
import { FeedItem, Collection } from '@/api-client';
import { Fragment } from 'react';
import Link from 'next/link';
import { getRelativeTime } from '@/lib/utils/time';
import { getRecordKey } from '@/lib/utils/atproto';
import { sanitizeText } from '@/lib/utils/text';
import { useColorScheme } from '@mantine/hooks';
import { BiCollection } from 'react-icons/bi';

interface Props {
  user: FeedItem['user'];
  collections?: FeedItem['collections'];
  createdAt: Date;
}

export default function FeedActivityStatus(props: Props) {
  const colorScheme = useColorScheme();
  const MAX_DISPLAYED = 2;
  const time = getRelativeTime(props.createdAt.toString());
  const relativeCreatedDate = time === 'just now' ? `Now` : `${time} ago`;

  const renderActivityText = () => {
    const collections = props.collections ?? [];
    const displayedCollections = collections.slice(0, MAX_DISPLAYED);
    const remainingCollections = collections.slice(
      MAX_DISPLAYED,
      collections.length,
    );
    const remainingCount = collections.length - MAX_DISPLAYED;

    return (
      <Text fw={500} c={'gray'}>
        <Anchor
          component={Link}
          href={`/profile/${props.user.handle}`}
          c="dark"
          fw={600}
        >
          {sanitizeText(props.user.name)}
        </Anchor>{' '}
        {collections.length === 0 ? (
          'added to library'
        ) : (
          <Fragment>
            added to{' '}
            {displayedCollections.map(
              (collection: Collection, index: number) => (
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
              ),
            )}
            {remainingCount > 0 && ' and '}
            {remainingCount > 0 && (
              <Menu shadow="sm">
                <Menu.Target>
                  <Text
                    fw={600}
                    c={'blue'}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    span
                  >
                    {remainingCount} other collection
                    {remainingCount > 1 ? 's' : ''}
                  </Text>
                </Menu.Target>
                <Menu.Dropdown maw={380}>
                  <ScrollArea.Autosize mah={150} type="auto">
                    {remainingCollections.map((c) => (
                      <Menu.Item
                        key={c.id}
                        component={Link}
                        href={`/profile/${c.author.handle}/collections/${getRecordKey(c.uri!)}`}
                        target="_blank"
                        c="blue"
                        fw={600}
                      >
                        {c.name}
                      </Menu.Item>
                    ))}
                  </ScrollArea.Autosize>
                </Menu.Dropdown>
              </Menu>
            )}
          </Fragment>
        )}
        <Text fz={'sm'} fw={600} c={'gray'} span display={'block'}>
          {relativeCreatedDate}
        </Text>
      </Text>
    );
  };

  return (
    <Card p={0} bg={colorScheme === 'dark' ? 'dark.4' : 'gray.1'} radius={'lg'}>
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
    </Card>
  );
}
