'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Button,
  Stack,
  Title,
  Text,
  Loader,
  Card,
  Center,
} from '@mantine/core';

function CallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [message, setMessage] = useState('Processing your login...');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeOAuth } = useAuth();

  useEffect(() => {
    // Store params immediately to avoid race conditions
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const iss = searchParams.get('iss') || '';

    // Clear the URL parameters for security right away
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);

    const processCallback = async () => {
      try {
        if (!code || !state || !iss) {
          throw new Error("Missing required parameters. Can't complete oauth");
        }

        // Use the auth context to complete the OAuth flow
        await completeOAuth(code, state, iss);

        setStatus('success');
        setMessage('Login successful!');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'An error occurred during authentication');
      }
    };

    if (code && state) {
      processCallback();
    } else {
      setStatus('error');
      setMessage('Missing required authentication parameters');
    }
  }, [completeOAuth]);

  return (
    <Card withBorder shadow="md">
      {status === 'loading' && (
        <Stack align="center">
          <Stack gap={0} align="center">
            <Title order={2}>Completing Sign In</Title>
            <Text>Please wait while we complete your authentication...</Text>
          </Stack>
          <Loader type="bars" />
        </Stack>
      )}

      {status === 'success' && (
        <Stack align="center">
          <Stack gap={0} align="center">
            <Title order={2} c={'green'}>
              Success!
            </Title>
            <Text>{message}</Text>
          </Stack>
          <Text>Redirecting you to your dashboard...</Text>
        </Stack>
      )}

      {status === 'error' && (
        <Stack align="center">
          <Stack gap={0} align="center">
            <Title order={2} c={'red'}>
              Error
            </Title>
            <Text>{message}</Text>
          </Stack>
          <Button onClick={() => router.push('/login')}>Try Again</Button>
        </Stack>
      )}
    </Card>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Center h={'100svh'}>
      <Suspense
        fallback={
          <Card>
            <Stack align="center">
              <Title order={2}>Loading</Title>
              <Loader />
            </Stack>
          </Card>
        }
      >
        <CallbackContent />
      </Suspense>
    </Center>
  );
}
