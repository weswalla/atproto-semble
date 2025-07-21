'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ApiClient } from '@/api-client/ApiClient';
import { ExtensionService } from '@/services/extensionService';
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
import { getAccessToken } from '@/services/auth';

export default function LoginPage() {
  const [handle, setHandle] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [useAppPassword, setUseAppPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens, isAuthenticated } = useAuth();

  const isExtensionLogin = searchParams.get('extension-login') === 'true';

  // Create API client instance
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => getAccessToken(), // Use auth token when available
  );

  // Handle extension login if user is already authenticated
  useEffect(() => {
    if (isExtensionLogin && isAuthenticated) {
      handleExtensionTokenGeneration();
    }
  }, [isExtensionLogin, isAuthenticated]);

  const handleExtensionTokenGeneration = async () => {
    try {
      setIsLoading(true);
      const tokens = await apiClient.generateExtensionTokens();
      console.log('Generated extension tokens:', tokens);

      await ExtensionService.sendTokensToExtension(tokens);

      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to generate extension tokens');
    } finally {
      setIsLoading(false);
    }
  };

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

      // Set tokens
      setTokens(accessToken, refreshToken);

      // Handle extension login or redirect to dashboard
      if (isExtensionLogin) {
        await handleExtensionTokenGeneration();
      } else {
        router.push('/library');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Center h={'100svh'}>
      <Stack align="center">
        <Title order={1}>
          {isExtensionLogin ? 'Sign in for Extension' : 'Sign in with Bluesky'}
        </Title>

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
