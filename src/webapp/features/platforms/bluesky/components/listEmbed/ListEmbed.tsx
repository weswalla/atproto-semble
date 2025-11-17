import { AppBskyGraphDefs } from '@atproto/api';
import { BsFillPeopleFill } from 'react-icons/bs';
import { Card, Group, Text } from '@mantine/core';

interface Props {
  list: AppBskyGraphDefs.ListView;
}

export default function ListEmbed(props: Props) {
  const { list } = props;

  return (
    <Card withBorder>
      <Group gap={'xs'}>
        <BsFillPeopleFill />
        <Text fz={'sm'} fw={500} c={'bright'} lineClamp={1}>
          {list.name}
        </Text>
      </Group>
      <Text fz={'sm'} fw={500} c={'gray'} lineClamp={1} span>
        @{list.creator.handle}
      </Text>
    </Card>
  );
}
