import { Button } from '@mantine/core';
import Link from 'next/link';

interface Props {
  name: string;
  url: string;
}

export default function CollectionNavItem(props: Props) {
  return (
    <Button
      component={Link}
      href={props.url}
      variant="subtle"
      size="md"
      color="gray"
      radius={'md'}
      fullWidth
      justify="start"
    >
      {props.name}
    </Button>
  );
}
