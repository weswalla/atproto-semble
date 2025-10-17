import useProfile from '@/features/profile/lib/queries/useProfile';
import { getRelativeTime } from '@/lib/utils/time';
import { Avatar, Card, Group, Spoiler, Stack, Text } from '@mantine/core';
import { Suspense } from 'react';

interface Props {
  id: string;
  note: string;
  createdAt: string;
  authorId: string;
}

export default function NoteCard(props: Props) {
  const { data: author } = useProfile({ didOrHandle: props.authorId });
  const time = getRelativeTime(props.createdAt);
  const relativeCreateDate = time === 'just now' ? `${time}` : `${time} ago`;

  return (
    <Card p={'sm'} radius={'lg'} withBorder>
      <Stack>
        <Spoiler showLabel={'Read more'} hideLabel={'See less'} maxHeight={200}>
          <Text>{props.note}</Text>
        </Spoiler>

        <Suspense fallback={<Text>LOADINGLOADINGLOADING</Text>}>
          <Group gap={'xs'}>
            <Avatar
              src={author.avatarUrl}
              alt={`${author.handle}'s avatar`}
              size={'sm'}
            />

            <Text c={'gray'}>
              <Text c={'dark'} fw={500} span>
                {author.name}
              </Text>
              <Text span>{' · '}</Text>
              <Text span>{relativeCreateDate} </Text>
            </Text>
          </Group>
        </Suspense>
      </Stack>
    </Card>
  );
}
