import CreateCollectionDrawer from '@/features/collections/components/createCollectionDrawer/CreateCollectionDrawer';
import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from 'react';

type DrawerName = 'createCollection';

type DrawerPropsMap = {
  createCollection: {};
};

interface DrawerState<T = any> {
  name: DrawerName | null;
  innerProps: T;
}

interface DrawersContextType {
  open: <T extends DrawerName>(args: {
    drawer: T;
    innerProps?: DrawerPropsMap[T];
  }) => void;
  close: () => void;
  isOpen: (name: DrawerName) => boolean;
  innerProps: any;
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
  const [state, setState] = useState<DrawerState>({
    name: null,
    innerProps: {},
  });

  const open = useCallback(
    <T extends DrawerName>({
      drawer,
      innerProps = {},
    }: {
      drawer: T;
      innerProps?: DrawerPropsMap[T];
    }) => {
      setState({ name: drawer, innerProps });
    },
    [],
  );

  const close = useCallback(() => {
    setState({ name: null, innerProps: {} });
  }, []);

  const isOpen = useCallback(
    (name: DrawerName) => state.name === name,
    [state.name],
  );

  return (
    <DrawersContext.Provider
      value={{ open, close, isOpen, innerProps: state.innerProps }}
    >
      {children}

      {/* Render */}
      <CreateCollectionDrawer
        isOpen={isOpen('createCollection')}
        onClose={close}
        {...state.innerProps}
      />
    </DrawersContext.Provider>
  );
};
