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
  description?: string;
  checked: boolean;
  onChange: (
    checked: boolean,
    item: { id: string; name: string; description?: string },
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
          description: props.description,
        })
      }
    >
      <Group justify="space-between">
        <Stack gap={0}>
          <Text fw={500} lineClamp={1}>
            {props.name}
          </Text>
          {props.description && (
            <Text c={'gray'} lineClamp={2}>
              {props.description}
            </Text>
          )}
        </Stack>
        <CheckboxIndicator />
      </Group>
    </CheckboxCard>
  );
}
