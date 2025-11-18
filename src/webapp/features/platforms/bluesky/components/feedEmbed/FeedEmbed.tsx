import { AppBskyFeedDefs } from '@atproto/api';
import { Avatar, Card, Group, Stack, Text } from '@mantine/core';

interface Props {
  feed: AppBskyFeedDefs.GeneratorView;
}

export default function FeedEmbed(props: Props) {
  return (
    <Card p={'xs'} withBorder>
      <Group gap={'xs'}>
        {props.feed.avatar && (
          <Avatar src={props.feed.avatar} alt={props.feed.displayName} />
        )}

        <Stack gap={0}>
          <Text fz={'sm'} fw={500} c={'bright'} lineClamp={1}>
            {props.feed.displayName}
          </Text>
          <Text fz={'sm'} fw={500} c={'gray'} lineClamp={1} span>
            Feed by @{props.feed.creator.handle}
          </Text>
        </Stack>
      </Group>
    </Card>
  );
}
