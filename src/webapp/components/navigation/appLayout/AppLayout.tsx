import { useDisclosure } from '@mantine/hooks';
import { ActionIcon, AppShell, Affix } from '@mantine/core';
import { FiPlus } from 'react-icons/fi';
import Header from '@/components/navigation/header/Header';
import Navbar from '@/components/navigation/navbar/Navbar';
import { useRouter } from 'next/navigation';

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
