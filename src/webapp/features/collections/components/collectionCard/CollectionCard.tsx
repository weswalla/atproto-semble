import { getRelativeTime } from '@/lib/utils/time';
import { Anchor, Card, Group, Stack, Text } from '@mantine/core';
import Link from 'next/link';
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
  const relativeUpdateDate =
    getRelativeTime(new Date(collection.updatedAt).toLocaleDateString()) +
    ' ago';

  // TODO: add more sizes
  return (
    <Card
      withBorder
      onClick={() => router.push(`/collections/${collection.id}`)}
      radius={'lg'}
      p={'sm'}
    >
      <Stack justify="space-between" h={'100%'}>
        <Stack gap={0}>
          <Text fw={600} fz={'lg'} lineClamp={1}>
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
            {collection.cardCount} · {relativeUpdateDate}
          </Text>
          <Anchor
            component={Link}
            href={`/collections/${collection.id}`}
            c={'blue'}
            fw={600}
          >
            View
          </Anchor>
        </Group>
      </Stack>
    </Card>
  );
}
