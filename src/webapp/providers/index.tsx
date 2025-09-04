'use client';

import { AuthProvider } from '@/hooks/useAuth';
import MantineProvider from './mantine';
import TanStackQueryProvider from './tanstack';
import { NavbarProvider } from './navbar';

interface Props {
  children: React.ReactNode;
}

export default function Providers(props: Props) {
  return (
    <TanStackQueryProvider>
      <AuthProvider>
        <MantineProvider>
          <NavbarProvider>{props.children}</NavbarProvider>
        </MantineProvider>
      </AuthProvider>
    </TanStackQueryProvider>
  );
}
