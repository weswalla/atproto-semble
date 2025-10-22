import { GetLibrariesForUrlResponse } from '@/api-client';
import { getRelativeTime } from '@/lib/utils/time';
import { Avatar, Card, Group, Stack, Text } from '@mantine/core';
import Link from 'next/link';

interface Props {
  item: GetLibrariesForUrlResponse['libraries'][0];
}

export default function AddedByCard(props: Props) {
  const time = getRelativeTime(props.item.card.createdAt);
  const relativeAddedDate =
    time === 'just now' ? `Added ${time}` : `Added ${time} ago`;

  return (
    <Card p={0} component={Link} href={`/profile/${props.item.user.handle}`}>
      <Group gap={'xs'} justify="space-between">
        <Group gap={'xs'}>
          <Avatar
            src={props.item.card.author.avatarUrl}
            alt={`${props.item.card.author.handle}'s avatar`}
          />

          <Stack gap={0}>
            <Text fw={600}>{props.item.card.author.name}</Text>
            <Text fw={600} c={'blue'}>
              {props.item.card.author.handle}
            </Text>
          </Stack>
        </Group>

        <Text c={'gray'}>{relativeAddedDate}</Text>
      </Group>
    </Card>
  );
}
