'use client';

import { AuthProvider } from '@/hooks/useAuth';
import MantineProvider from './mantine';
import TanStackQueryProvider from './tanstack';
import { NavbarProvider } from './navbar';
import { DrawersProvider } from './drawers';
import { Notifications } from '@mantine/notifications';

interface Props {
  children: React.ReactNode;
}

export default function Providers(props: Props) {
  return (
    <TanStackQueryProvider>
      <AuthProvider>
        <MantineProvider>
          <DrawersProvider>
            <NavbarProvider>{props.children}</NavbarProvider>
          </DrawersProvider>
        </MantineProvider>
      </AuthProvider>
    </TanStackQueryProvider>
  );
}
