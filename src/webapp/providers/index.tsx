'use client';

import { AuthProvider } from '@/hooks/useAuth';
import MantineProvider from './mantine';
import TanStackQueryProvider from './tanstack';

interface Props {
  children: React.ReactNode;
}

export default function Providers(props: Props) {
  return (
    <TanStackQueryProvider>
      <AuthProvider>
        <MantineProvider>{props.children}</MantineProvider>
      </AuthProvider>
    </TanStackQueryProvider>
  );
}
