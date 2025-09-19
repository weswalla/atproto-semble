import { getRelativeTime } from '@/lib/utils/time';
import { Card, Group, Stack, Text } from '@mantine/core';
import { useRouter } from 'next/navigation';

interface Props {
  size?: 'large' | 'compact' | 'list' | 'basic';
  collection: {
    id: string;
    name: string;
    description?: string;
    cardCount: number;
    createdAt: string;
    updatedAt: string;
    createdBy: {
      id: string;
      name: string;
      handle: string;
      avatarUrl?: string;
    };
  };
}

export default function CollectionCard(props: Props) {
  const router = useRouter();
  const { collection } = props;
  const time = getRelativeTime(collection.updatedAt);
  const relativeUpdateDate =
    time === 'just now' ? `Updated ${time}` : `Updated ${time} ago`;

  // TODO: add more sizes
  return (
    <Card
      withBorder
      onClick={() => router.push(`/collections/${collection.id}`)}
      radius={'lg'}
      p={'sm'}
      style={{ cursor: 'pointer' }}
    >
      <Stack justify="space-between" h={'100%'}>
        <Stack gap={0}>
          <Text fw={500} lineClamp={1}>
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
      </Stack>
    </Card>
  );
}
