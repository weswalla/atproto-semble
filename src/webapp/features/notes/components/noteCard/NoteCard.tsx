import { Card, Spoiler, Text } from '@mantine/core';

interface Props {
  note: string;
}

export default function NoteCard(props: Props) {
  return (
    <Card bg={'#E5E8E7'} p={'sm'}>
      <Spoiler showLabel={'Read more'} hideLabel={'See less'} maxHeight={45}>
        <Text fz={'sm'} c={'#74867F'}>
          {props.note}
        </Text>
      </Spoiler>
    </Card>
  );
}
