import { User } from '@/api-client/ApiClient';
import { Avatar, Card, Group, Spoiler, Stack, Text } from '@mantine/core';
import { getRelativeTime } from '@/lib/utils/time';

interface Props {
  id: string;
  note: string;
  createdAt: string;
  author: User;
}

export default function NoteCard(props: Props) {
  const time = getRelativeTime(props.createdAt);
  const relativeCreateDate = time === 'just now' ? `${time}` : `${time} ago`;

  return (
    <Card p={'sm'} radius={'lg'} withBorder>
      <Stack>
        <Spoiler showLabel={'Read more'} hideLabel={'See less'} maxHeight={200}>
          <Text fs={'italic'}>{props.note}</Text>
        </Spoiler>

        <Group gap={'xs'}>
          <Avatar
            src={props.author.avatarUrl}
            alt={`${props.author.handle}'s avatar`}
            size={'sm'}
          />

          <Text c={'gray'}>
            <Text c={'dark'} fw={500} span>
              {props.author.name}
            </Text>
            <Text span>{' · '}</Text>
            <Text span>{relativeCreateDate} </Text>
          </Text>
        </Group>
      </Stack>
    </Card>
  );
}
