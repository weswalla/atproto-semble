import { Tabs } from '@mantine/core';
import { useRouter } from 'next/navigation';
import classes from './TabItem.module.css';

interface Props {
  value: string;
  href: string;
  children: string;
}

export default function TabItem(props: Props) {
  const router = useRouter();

  return (
    <Tabs.Tab
      value={props.value}
      onClick={() => router.push(props.href)}
      className={classes.tab}
      color="dark"
      fw={600}
    >
      {props.children}
    </Tabs.Tab>
  );
}
