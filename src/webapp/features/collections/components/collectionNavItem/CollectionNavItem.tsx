import { Button } from '@mantine/core';

interface Props {
  name: string;
  url: string;
}

export default function CollectionNavItem(props: Props) {
  return (
    <Button
      component="a"
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
