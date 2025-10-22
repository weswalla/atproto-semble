import { TabsTab } from '@mantine/core';
import classes from './TabItem.module.css';

interface Props {
  value: string;
  children: string;
}

export default function TabItem(props: Props) {
  return (
    <TabsTab c={'dark'} value={props.value} className={classes.tab} fw={600}>
      {props.children}
    </TabsTab>
  );
}
