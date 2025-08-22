'use client';

import { NavLink } from '@mantine/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  href: string;
  label: string;
  icon: React.ReactElement;
  badge?: number;
}

export default function NavItem(props: Props) {
  const pathname = usePathname();
  const isActive = pathname === props.href;

  return (
    <NavLink
      component={Link}
      href={props.href}
      color="gray"
      c={'gray'}
      fw={600}
      label={props.label}
      leftSection={props.icon}
      active={isActive}
    />
  );
}
