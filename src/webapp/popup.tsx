import {
  ExtensionAuthProvider,
  useExtensionAuth,
} from './hooks/useExtensionAuth';
import { SaveCardPage } from './components/extension/SaveCardPage';
import { SignInPage } from './components/extension/SignInPage';
import { Card, MantineProvider, ScrollArea, Text, Stack } from '@mantine/core';
import '@mantine/core/styles.css';
import { theme } from '@/styles/theme';

function PopupContent() {
  const { isAuthenticated, isLoading } = useExtensionAuth();

  if (isLoading) {
    return (
      <Stack align="center" p="md">
        <Text>Loading...</Text>
      </Stack>
    );
  }

  if (!isAuthenticated) {
    return <SignInPage />;
  }

  return <SaveCardPage />;
}

function IndexPopup() {
  return (
    <MantineProvider theme={theme}>
      <ExtensionAuthProvider>
        <ScrollArea.Autosize w={400} mah={600}>
          <Card>
            <PopupContent />
          </Card>
        </ScrollArea.Autosize>
      </ExtensionAuthProvider>
    </MantineProvider>
  );
}

export default IndexPopup;
