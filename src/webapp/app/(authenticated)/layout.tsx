'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { ActionIcon, AppShell, Group, NavLink, Text, Affix } from '@mantine/core';
import { FiSidebar } from 'react-icons/fi';
import { IoDocumentTextOutline } from 'react-icons/io5';
import { BsFolder2 } from 'react-icons/bs';
import { BiUser } from 'react-icons/bi';
import { FiPlus } from 'react-icons/fi';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (!isAuthenticated) {
    return null; // Redirecting
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" gap={'xs'}>
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={() => {
              isMobile ? toggleMobile() : toggleDesktop();
            }}
          >
            <FiSidebar />
          </ActionIcon>
          <Text fw={600}>Annos</Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          href="/library"
          label="My cards"
          active={pathname === '/library'}
          leftSection={<IoDocumentTextOutline />}
        />
        <NavLink
          href="/collections"
          label="My collections"
          active={pathname === '/collections'}
          leftSection={<BsFolder2 />}
        />
        <NavLink
          href="/profile"
          label="Profile"
          active={pathname === '/profile'}
          leftSection={<BiUser />}
          mt="auto"
        />
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
        <Affix position={{ bottom: 20, right: 20 }}>
          <ActionIcon
            onClick={() => router.push('/cards/add')}
            size={56}
            radius="xl"
            color="blue"
            variant="filled"
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <FiPlus size={24} />
          </ActionIcon>
        </Affix>
      </AppShell.Main>
    </AppShell>
  );
}
