import { useState } from 'react';
import { Button, Text, Stack, TextInput, Alert, Anchor } from '@mantine/core';
import { useExtensionAuth } from '../../hooks/useExtensionAuth';

export function SignInPage() {
  const { loginWithAppPassword, error, isLoading } = useExtensionAuth();
  const [showAppPasswordForm, setShowAppPasswordForm] = useState(false);
  const [handle, setHandle] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleSignIn = () => {
    const appUrl = process.env.PLASMO_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginUrl = `${appUrl}/login?extension-login=true`;
    chrome.tabs.create({ url: loginUrl });
    window.close();
  };

  const handleAppPasswordLogin = async () => {
    if (!handle.trim() || !appPassword.trim()) {
      setLoginError('Please enter both handle and app password');
      return;
    }

    setLoginError('');
    try {
      await loginWithAppPassword(handle.trim(), appPassword.trim());
      // Success - the auth context will handle the state update
    } catch (error: any) {
      setLoginError(
        error.message || 'Login failed. Please check your credentials.',
      );
    }
  };

  if (showAppPasswordForm) {
    return (
      <Stack p="md" gap="md">
        <Text size="sm" ta="center">
          Sign in with App Password
        </Text>

        <TextInput
          label="Handle"
          placeholder="your-handle.bsky.social"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          disabled={isLoading}
        />

        <TextInput
          label="App Password"
          type="password"
          placeholder="xxxx-xxxx-xxxx-xxxx"
          value={appPassword}
          onChange={(e) => setAppPassword(e.target.value)}
          disabled={isLoading}
        />

        {(loginError || error) && (
          <Alert color="red" size="sm">
            {loginError || error}
          </Alert>
        )}

        <Stack gap="xs">
          <Button
            onClick={handleAppPasswordLogin}
            loading={isLoading}
            disabled={!handle.trim() || !appPassword.trim()}
            fullWidth
          >
            Sign In
          </Button>

          <Button
            variant="subtle"
            onClick={() => setShowAppPasswordForm(false)}
            disabled={isLoading}
            fullWidth
          >
            Back
          </Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack align="center" p="md" gap="md">
      <Text size="sm" ta="center">
        Sign in to your account to save cards
      </Text>
      <Button onClick={handleSignIn} fullWidth>
        Sign In
      </Button>
      <Anchor
        size="sm"
        onClick={() => setShowAppPasswordForm(true)}
        style={{ cursor: 'pointer' }}
      >
        Sign in with App Password
      </Anchor>
    </Stack>
  );
}
