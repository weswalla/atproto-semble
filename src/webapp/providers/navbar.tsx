'use client';

import React, { createContext, useContext } from 'react';
import { useDisclosure } from '@mantine/hooks';

interface NavbarContext {
  opened: boolean;
  toggle: () => void;
}

const NavbarContext = createContext<NavbarContext>({
  opened: true,
  toggle: () => {},
});

interface ProviderProps {
  children: React.ReactNode;
}

export function NavbarProvider(props: ProviderProps) {
  const [opened, { toggle }] = useDisclosure();

  return (
    <NavbarContext.Provider value={{ opened, toggle }}>
      {props.children}
    </NavbarContext.Provider>
  );
}

export function useNavbarContext() {
  const context = useContext(NavbarContext);

  if (!context) {
    throw new Error('useNavbarContext must be used within a NavbarProvider');
  }

  return context;
}
