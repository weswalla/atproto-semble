import { Button, Text, Stack } from '@mantine/core';

export function SignInPage() {
  const handleSignIn = () => {
    const appUrl =
      process.env.PLASMO_PUBLIC_APP_URL || 'http://localhost:3000';
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
