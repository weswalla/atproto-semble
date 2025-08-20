import { useDisclosure } from '@mantine/hooks';
import { AppShell } from '@mantine/core';
import Header from '@/components/navigation/header/Header';
import Navbar from '@/components/navigation/navbar/Navbar';
import { useRouter } from 'next/navigation';
import ComposerDrawer from '@/features/composer/components/composerDrawer/ComposerDrawer';

interface Props {
  children: React.ReactNode;
}

export default function AppLayout(props: Props) {
  const [opened, { toggle }] = useDisclosure();
  const router = useRouter();

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
        <ComposerDrawer />
      </AppShell.Main>
    </AppShell>
  );
}
