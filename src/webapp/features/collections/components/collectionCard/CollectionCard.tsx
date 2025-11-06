'use client';

import type { Collection } from '@/api-client';
import { getRecordKey } from '@/lib/utils/atproto';
import { getRelativeTime } from '@/lib/utils/time';
import { Avatar, Card, Group, Stack, Text } from '@mantine/core';
import styles from './CollectionCard.module.css';
import { useRouter } from 'next/navigation';

interface Props {
  size?: 'large' | 'compact' | 'list' | 'basic';
  showAuthor?: boolean;
  collection: Collection;
}

export default function CollectionCard(props: Props) {
  const router = useRouter();
  const { collection } = props;
  const rkey = getRecordKey(collection.uri!!);
  const time = getRelativeTime(collection.updatedAt);
  const relativeUpdateDate =
    time === 'just now' ? `Updated ${time}` : `Updated ${time} ago`;

  // TODO: add more sizes
  return (
    <Card
      withBorder
      onClick={() =>
        router.push(`/profile/${collection.author.handle}/collections/${rkey}`)
      }
      radius={'lg'}
      p={'sm'}
      className={styles.root}
    >
      <Stack justify="space-between" h={'100%'}>
        <Stack gap={0}>
          <Text fw={500} lineClamp={1} c={'var(--mantine-color-bright)'}>
            {collection.name}
          </Text>
          {collection.description && (
            <Text c={'gray'} lineClamp={2}>
              {collection.description}
            </Text>
          )}
        </Stack>
        <Group justify="space-between">
          <Text c={'gray'}>
            {collection.cardCount}{' '}
            {collection.cardCount === 1 ? 'card' : 'cards'} ·{' '}
            {relativeUpdateDate}
          </Text>
        </Group>
        {props.showAuthor && (
          <Group gap={'xs'}>
            <Avatar
              src={collection.author.avatarUrl}
              alt={`${collection.author.handle}'s avatar`}
              size={'sm'}
            />

            <Text fw={500} span>
              {collection.author.name}
            </Text>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
