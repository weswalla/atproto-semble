import {
  ExtensionAuthProvider,
  useExtensionAuth,
} from './hooks/useExtensionAuth';
import { SaveCardPage } from './components/extension/SaveCardPage';
import { Card, MantineProvider, ScrollArea, Button, Text, Stack } from '@mantine/core';
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
    const handleSignIn = () => {
      const appUrl = process.env.PLASMO_PUBLIC_APP_URL || 'http://localhost:3000';
      const loginUrl = `${appUrl}/login?extension-login=true`;
      chrome.tabs.create({ url: loginUrl });
      window.close();
    };

    return (
      <Stack align="center" p="md" gap="md">
        <Text size="sm" ta="center">
          Sign in to your account to save cards
        </Text>
        <Button onClick={handleSignIn} fullWidth>
          Sign In
        </Button>
      </Stack>
    );
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
