import { Badge, NavLink } from '@mantine/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  name: string;
  url: string;
  cardCount: number;
}

export default function CollectionNavItem(props: Props) {
  const pathname = usePathname();
  const isActive = pathname === props.url;

  return (
    <NavLink
      component={Link}
      href={props.url}
      label={props.name}
      variant="subtle"
      c={isActive ? 'dark' : 'gray'}
      rightSection={
        props.cardCount > 0 ? (
          <Badge variant="light" color="gray" circle>
            {props.cardCount}
          </Badge>
        ) : null
      }
    />
  );
}
