import { AppShell } from '@mantine/core';
import Navbar from '@/components/navigation/navbar/Navbar';
import ComposerDrawer from '@/features/composer/components/composerDrawer/ComposerDrawer';
import { useNavbarContext } from '@/providers/navbar';

interface Props {
  children: React.ReactNode;
}

export default function AppLayout(props: Props) {
  const { mobileOpened, desktopOpened } = useNavbarContext();

  return (
    <AppShell
      header={{ height: 0 }}
      navbar={{
        width: 300,
        breakpoint: 'xs',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
    >
      {/*<Header />*/}
      <Navbar />

      <AppShell.Main>
        {props.children}
        <ComposerDrawer />
      </AppShell.Main>
    </AppShell>
  );
}
