'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ApiClient } from '@/api-client/ApiClient';
import {
  Title,
  Button,
  Stack,
  Center,
  Card,
  TextInput,
  PasswordInput,
  Text,
  Group,
} from '@mantine/core';

export default function LoginPage() {
  const [handle, setHandle] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [useAppPassword, setUseAppPassword] = useState(false);
  const router = useRouter();
  const { setTokens } = useAuth();

  // Create API client instance
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => null, // No auth token needed for login
  );

  const handleOAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!handle) {
      setError('Please enter your Bluesky handle');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { authUrl } = await apiClient.initiateOAuthSignIn({ handle });

      // Redirect to the auth URL from the API
      window.location.href = authUrl;
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!handle || !appPassword) {
      setError('Please enter both your handle and app password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { accessToken, refreshToken } =
        await apiClient.loginWithAppPassword({
          identifier: handle,
          appPassword: appPassword,
        });

      // Set tokens and redirect to dashboard
      setTokens(accessToken, refreshToken);
      router.push('/library');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Center h={'100svh'}>
      <Stack align="center">
        <Title order={1}>Sign in with Bluesky</Title>

        <Card withBorder w={400}>
          {!useAppPassword ? (
            <form onSubmit={handleOAuthSubmit}>
              <Stack>
                <Stack>
                  <TextInput
                    id="handle"
                    label="Enter your Bluesky handle"
                    placeholder="username.bsky.social"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                  />
                  {error && (
                    <Text fz={'sm'} c={'red'}>
                      {error}
                    </Text>
                  )}
                </Stack>

                <Group grow>
                  <Button type="submit" loading={isLoading}>
                    {isLoading ? 'Connecting...' : 'Continue'}
                  </Button>
                </Group>

                <Stack>
                  <Button
                    type="button"
                    onClick={() => setUseAppPassword(true)}
                    variant="transparent"
                    color="blue"
                  >
                    Sign in with app password
                  </Button>
                </Stack>
              </Stack>
            </form>
          ) : (
            <form onSubmit={handleAppPasswordSubmit}>
              <Stack>
                <Stack>
                  <TextInput
                    id="handle-app"
                    label="Bluesky handle"
                    placeholder="username.bsky.social"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                  />

                  <Stack>
                    <PasswordInput
                      id="app-password"
                      label="App password"
                      placeholder="xxxx-xxxx-xxxx-xxxx"
                      value={appPassword}
                      onChange={(e) => setAppPassword(e.target.value)}
                    />
                    {error && (
                      <Text fz={'sm'} c={'red'}>
                        {error}
                      </Text>
                    )}
                  </Stack>
                </Stack>

                <Button type="submit" disabled={isLoading} loading={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>

                <Stack>
                  <Button
                    type="button"
                    onClick={() => setUseAppPassword(false)}
                    variant="transparent"
                    color="blue"
                  >
                    Back to OAuth sign in
                  </Button>
                </Stack>
              </Stack>
            </form>
          )}
        </Card>
      </Stack>
    </Center>
  );
}
