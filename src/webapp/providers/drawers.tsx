import React, { createContext, useContext, ReactNode } from 'react';
import AddCardDrawer from '@/features/cards/components/addCardDrawer/AddCardDrawer';
import CreateCollectionDrawer from '@/features/collections/components/createCollectionDrawer/CreateCollectionDrawer';
import { Drawer, useDrawersStack } from '@mantine/core'; // Importing Mantine's hook

type DrawerName = 'createCollection' | 'addCard';

interface DrawersContextType {
  open: <T extends DrawerName>(drawer: T) => void;
  close: (drawer: DrawerName) => void;
  closeAll: () => void;
  toggle: (name: DrawerName) => void;
  isOpen: (name: DrawerName) => boolean;
}

const DrawersContext = createContext<DrawersContextType | undefined>(undefined);

export const useContextDrawers = () => {
  const ctx = useContext(DrawersContext);
  if (!ctx) {
    throw new Error('useContextDrawers must be used within a DrawersProvider');
  }
  return ctx;
};

export const DrawersProvider = ({ children }: { children: ReactNode }) => {
  // Initialize the drawer stack with the available drawers
  // https://mantine.dev/core/drawer/#usedrawersstack-hook
  const stack = useDrawersStack<DrawerName>(['addCard', 'createCollection']);

  return (
    <DrawersContext.Provider
      value={{
        open: stack.open,
        close: stack.close,
        closeAll: stack.closeAll,
        isOpen: (name: DrawerName) => stack.state[name], // Access the state object to check if the drawer is open
        toggle: stack.toggle,
      }}
    >
      {children}

      <Drawer.Stack>
        {/* Render Drawers */}
        <AddCardDrawer
          {...stack.register('addCard')}
          isOpen={stack.state['addCard']}
        />
        <CreateCollectionDrawer
          {...stack.register('createCollection')}
          isOpen={stack.state['createCollection']}
        />
      </Drawer.Stack>
    </DrawersContext.Provider>
  );
};
