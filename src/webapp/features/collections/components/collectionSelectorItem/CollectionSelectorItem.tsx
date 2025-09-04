import {
  CheckboxCard,
  CheckboxIndicator,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import classes from './CollectionSelectorItem.module.css';

interface Props {
  value: string;
  name: string;
  checked: boolean;
  cardCount: number;
  onChange: (
    checked: boolean,
    item: { id: string; name: string; cardCount: number },
  ) => void;
}

export default function CollectionSelectorItem(props: Props) {
  return (
    <CheckboxCard
      radius={'lg'}
      p={'sm'}
      className={classes.root}
      value={props.value}
      checked={props.checked}
      onChange={(checked) =>
        props.onChange(checked, {
          id: props.value,
          name: props.name,
          cardCount: props.cardCount,
        })
      }
    >
      <Group justify="space-between">
        <Stack gap={0}>
          <Text fw={500} lineClamp={1}>
            {props.name}
          </Text>
          <Text c={'gray'}>
            {props.cardCount} {props.cardCount === 1 ? 'card' : 'cards'}
          </Text>
        </Stack>
        <CheckboxIndicator />
      </Group>
    </CheckboxCard>
  );
}
