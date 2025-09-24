'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ExtensionService } from '@/services/extensionService';
import { ApiClient } from '@/api-client/ApiClient';
import { createClientTokenManager } from '@/services/auth';
import { Card, Center, Loader, Stack, Title, Text } from '@mantine/core';

function AuthCompleteContent() {
  const [message, setMessage] = useState('Processing your login...');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens } = useAuth();

  useEffect(() => {
    const handleAuth = async () => {
      // Create API client instance
      const apiClient = new ApiClient(
        process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
        createClientTokenManager(),
      );

      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');

      // Clear the URL parameters for security
      const cleanUrl = '/';
      window.history.replaceState({}, document.title, cleanUrl);

      if (error) {
        console.error('Authentication error:', error);
        router.push(`/login?error=${encodeURIComponent(error)}`);
        return;
      }

      const handleExtensionTokenGeneration = async () => {
        try {
          setMessage('Generating extension tokens...');

          const tokens = await apiClient.generateExtensionTokens();
          await ExtensionService.sendTokensToExtension(tokens);
          ExtensionService.clearExtensionTokensRequested();

          setMessage('Extension tokens generated successfully!');

          // Redirect to extension success page after successful extension token generation
          setTimeout(() => router.push('/extension/auth/complete'), 1000);
        } catch (extensionError: any) {
          console.error('Failed to generate extension tokens:', extensionError);
          ExtensionService.clearExtensionTokensRequested();

          // Redirect to extension error page
          router.push('/extension/auth/error');
        }
      };

      if (accessToken && refreshToken) {
        // Store tokens using the auth context function
        await setTokens(accessToken, refreshToken);

        // Check if extension tokens were requested
        if (ExtensionService.isExtensionTokensRequested()) {
          handleExtensionTokenGeneration();
        } else {
          // Redirect to library
          router.push('/library');
        }
      } else {
        router.push('/login?error=Authentication failed');
      }
    };

    handleAuth();
  }, [router, searchParams, setTokens]);

  return (
    <Stack align="center">
      <Stack gap={0} align="center">
        <Title order={2}>Signing you in...</Title>
        <Text>{message}</Text>
      </Stack>
      <Loader type="dots" />
    </Stack>
  );
}

export default function AuthCompletePage() {
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
        <AuthCompleteContent />
      </Suspense>
    </Center>
  );
}
