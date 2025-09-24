import { Anchor, Tabs } from '@mantine/core';
import classes from './TabItem.module.css';
import Link from 'next/link';

interface Props {
  value: string;
  href: string;
  children: string;
}

export default function TabItem(props: Props) {
  return (
    <Anchor component={Link} href={props.href} c={'dark'} underline="never">
      <Tabs.Tab
        value={props.value}
        className={classes.tab}
        color="dark"
        fw={600}
      >
        {props.children}
      </Tabs.Tab>
    </Anchor>
  );
}
