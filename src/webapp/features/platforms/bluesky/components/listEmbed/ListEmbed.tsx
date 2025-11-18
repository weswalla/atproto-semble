import { AppBskyGraphDefs } from '@atproto/api';
import { BsFillPeopleFill } from 'react-icons/bs';
import { Card, Group, Text } from '@mantine/core';

interface Props {
  list: AppBskyGraphDefs.ListView;
}

export default function ListEmbed(props: Props) {
  return (
    <Card p={'xs'} withBorder>
      <Group gap={'xs'}>
        <BsFillPeopleFill />
        <Text fz={'sm'} fw={500} c={'bright'} lineClamp={1}>
          {props.list.name}
        </Text>
      </Group>
      <Text fz={'sm'} fw={500} c={'gray'} lineClamp={1} span>
        @{props.list.creator.handle}
      </Text>
    </Card>
  );
}
