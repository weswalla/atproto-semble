'use client';

import { AppShell } from '@mantine/core';
import { useNavbarContext } from '@/providers/navbar';
import { usePathname } from 'next/navigation';
import GuestNavbar from '../guestNavbar/GuestNavbar';
import GuestBottomBar from '../guestBottomBar/GuestBottomBar';

interface Props {
  children: React.ReactNode;
}

export default function GuestAppLayout(props: Props) {
  const { mobileOpened, desktopOpened } = useNavbarContext();
  const pathname = usePathname();

  const ROUTES_WITH_ASIDE = ['/url'];
  const hasAside = ROUTES_WITH_ASIDE.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const asideWidth = hasAside ? 300 : 0;

  return (
    <AppShell
      header={{ height: 0 }}
      navbar={{
        width: 300,
        breakpoint: 'xs',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      aside={{
        width: asideWidth,
        breakpoint: 'xl',
        collapsed: { mobile: true },
      }}
    >
      <GuestNavbar />

      <AppShell.Main>{props.children}</AppShell.Main>

      <GuestBottomBar />
    </AppShell>
  );
}
