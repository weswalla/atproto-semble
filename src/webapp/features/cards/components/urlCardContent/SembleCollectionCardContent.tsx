import { Group, Stack, Text } from '@mantine/core';
import { UrlCard } from '@semble/types';

interface Props {
  cardContent: UrlCard['cardContent'];
}

export default function SembleCollectionCardContent(props: Props) {
  return (
    <Group justify="space-between" align="start" gap={'lg'}>
      <Stack gap={0} flex={1}>
        <Text c={'grape'} fw={500}>
          Collection
        </Text>
        {props.cardContent.title && (
          <Text c={'bright'} lineClamp={2} fw={500} w={'fit-content'}>
            {props.cardContent.title}
          </Text>
        )}
        {props.cardContent.description && (
          <Text c={'gray'} fz={'sm'} mt={'xs'} lineClamp={3}>
            {props.cardContent.description}
          </Text>
        )}
      </Stack>
    </Group>
  );
}
