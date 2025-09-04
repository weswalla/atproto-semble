'use client';

import React, { createContext, useContext } from 'react';
import { useDisclosure } from '@mantine/hooks';

interface NavbarContext {
  mobileOpened: boolean;
  desktopOpened: boolean;
  toggleMobile: () => void;
  toggleDesktop: () => void;
}

const NavbarContext = createContext<NavbarContext>({
  mobileOpened: false,
  desktopOpened: true,
  toggleMobile: () => {},
  toggleDesktop: () => {},
});

interface ProviderProps {
  children: React.ReactNode;
}

export function NavbarProvider({ children }: ProviderProps) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure(false);
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  return (
    <NavbarContext.Provider
      value={{ mobileOpened, desktopOpened, toggleMobile, toggleDesktop }}
    >
      {children}
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
