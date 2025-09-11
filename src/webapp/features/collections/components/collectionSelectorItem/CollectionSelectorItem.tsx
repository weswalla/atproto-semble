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
      <Group justify="space-between" wrap="nowrap">
        <Group gap={'xs'} wrap="nowrap">
          <Text fw={500} lineClamp={1} flex={1}>
            {props.name}
          </Text>
          <Text c={'gray'}>·</Text>
          <Text c={'gray'}>
            {props.cardCount} {props.cardCount === 1 ? 'card' : 'cards'}
          </Text>
        </Group>
        <CheckboxIndicator />
      </Group>
    </CheckboxCard>
  );
}
