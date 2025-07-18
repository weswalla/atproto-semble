import { useEffect, useState } from 'react';
import { ExtensionAuthProvider } from './hooks/useExtensionAuth';
import { ApiClient } from './api-client/ApiClient';
import {
  Card,
  Center,
  Loader,
  MantineProvider,
  Stack,
  Text,
} from '@mantine/core';
import '@mantine/core/styles.css';
import { theme } from '@/styles/theme';

function AuthContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [message, setMessage] = useState('Validating authentication...');

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Parse tokens from URL hash
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');

        if (!accessToken || !refreshToken) {
          throw new Error('Missing authentication tokens');
        }

        // Create API client with the access token
        const apiClient = new ApiClient(
          process.env.PLASMO_PUBLIC_API_URL || 'http://localhost:4000',
          () => accessToken,
        );

        // Validate the token by fetching user profile
        const userData = await apiClient.getMyProfile();

        // Store tokens in chrome storage
        if (typeof chrome !== 'undefined' && chrome.storage) {
          await new Promise<void>((resolve) => {
            chrome.storage.local.set(
              {
                accessToken,
                refreshToken,
              },
              () => {
                resolve();
              },
            );
          });
        } else {
          // Fallback to localStorage for development
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        }

        setStatus('success');
        setMessage('Authentication successful! Redirecting...');

        // Redirect to the library page
        setTimeout(() => {
          window.location.href = `${process.env.PLASMO_PUBLIC_APP_URL || 'http://localhost:4000'}/library`;
        }, 1500);
      } catch (error: any) {
        console.error('Authentication failed:', error);
        setStatus('error');
        setMessage('Authentication failed. Redirecting to login...');

        // Redirect to login page after a delay
        setTimeout(() => {
          window.location.href = `${process.env.PLASMO_PUBLIC_APP_URL || 'http://localhost:4000'}/login`;
        }, 2000);
      }
    };

    handleAuth();
  }, []);

  return (
    <Center h="100vh">
      <Card w={400} p="xl">
        <Stack align="center" gap="md">
          {status === 'loading' && <Loader size="lg" />}
          {status === 'success' && (
            <div style={{ color: 'green', fontSize: '2rem' }}>✓</div>
          )}
          {status === 'error' && (
            <div style={{ color: 'red', fontSize: '2rem' }}>✗</div>
          )}
          <Text ta="center" fw={500}>
            {message}
          </Text>
        </Stack>
      </Card>
    </Center>
  );
}

function IndexAuth() {
  return (
    <MantineProvider theme={theme}>
      <ExtensionAuthProvider>
        <AuthContent />
      </ExtensionAuthProvider>
    </MantineProvider>
  );
}

export default IndexAuth;
