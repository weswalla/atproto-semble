import { Tabs } from '@mantine/core';
import classes from './TabItem.module.css';

interface Props {
  value: string;
  children: string;
}

export default function TabItem(props: Props) {
  return (
    <Tabs.Tab value={props.value} className={classes.tab} color="dark" fw={600}>
      {props.children}
    </Tabs.Tab>
  );
}
