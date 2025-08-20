import { Button } from '@mantine/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  name: string;
  url: string;
}

export default function CollectionNavItem(props: Props) {
  const pathname = usePathname();
  const isActive = pathname === props.url;

  return (
    <Button
      component={Link}
      href={props.url}
      variant="subtle"
      size="md"
      color={isActive ? 'dark' : 'gray'}
      radius={'md'}
      fullWidth
      justify="start"
    >
      {props.name}
    </Button>
  );
}
