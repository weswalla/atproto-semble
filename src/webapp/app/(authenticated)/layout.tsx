'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDisclosure } from '@mantine/hooks';
import { ActionIcon, AppShell, Affix } from '@mantine/core';
import { FiPlus } from 'react-icons/fi';
import Header from '@/components/navigation/header/Header';
import Navbar from '@/components/navigation/navbar/Navbar';

interface Props {
  children: React.ReactNode;
}
export default function AuthenticatedLayout(props: Props) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [opened, { toggle }] = useDisclosure();

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
        collapsed: { mobile: !opened, desktop: opened },
      }}
      padding="md"
    >
      <Header onToggleNavbar={toggle} />
      <Navbar />

      <AppShell.Main>
        {props.children}
        <Affix position={{ bottom: 20, right: 20 }}>
          <ActionIcon
            onClick={() => router.push('/cards/add')}
            size={'input-lg'}
            radius="xl"
            variant="filled"
          >
            <FiPlus size={26} />
          </ActionIcon>
        </Affix>
      </AppShell.Main>
    </AppShell>
  );
}
