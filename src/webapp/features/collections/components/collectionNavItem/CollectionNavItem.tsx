import { useNavbarContext } from '@/providers/navbar';
import { Badge, NavLink } from '@mantine/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  name: string;
  url: string;
  cardCount: number;
}

export default function CollectionNavItem(props: Props) {
  const { toggleMobile } = useNavbarContext();
  const pathname = usePathname();
  const isActive = pathname === props.url;

  return (
    <NavLink
      component={Link}
      href={props.url}
      label={props.name}
      variant="subtle"
      c={isActive ? 'dark' : 'gray'}
      onClick={toggleMobile}
      rightSection={
        props.cardCount > 0 ? (
          <Badge
            variant={isActive ? 'filled' : 'light'}
            color={isActive ? 'dark' : 'gray'}
            circle
          >
            {props.cardCount}
          </Badge>
        ) : null
      }
    />
  );
}
