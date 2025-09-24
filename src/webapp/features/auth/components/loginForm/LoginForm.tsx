'use client';

import { ExtensionService } from '@/services/extensionService';
import { ApiClient } from '@/api-client/ApiClient';
import {
  Stack,
  Text,
  Button,
  UnstyledButton,
  Anchor,
  Popover,
  TextInput,
  PasswordInput,
  Alert,
} from '@mantine/core';
import { BiRightArrowAlt } from 'react-icons/bi';
import { IoMdHelpCircleOutline } from 'react-icons/io';
import { MdOutlineAlternateEmail, MdLock } from 'react-icons/md';
import { useAuth } from '@/hooks/useAuth';
import { createClientTokenManager } from '@/services/auth';
import { useForm } from '@mantine/form';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens, isAuthenticated } = useAuth();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isExtensionLogin = searchParams.get('extension-login') === 'true';
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    createClientTokenManager(),
  );

  const handleExtensionTokenGeneration = async () => {
    try {
      setIsLoading(true);
      const tokens = await apiClient.generateExtensionTokens();

      await ExtensionService.sendTokensToExtension(tokens);

      setError('');

      // Clear the extension tokens requested flag
      ExtensionService.clearExtensionTokensRequested();

      // Redirect to extension success page after successful extension token generation
      router.push('/extension/auth/complete');
    } catch (err: any) {
      // Clear the flag even on failure
      ExtensionService.clearExtensionTokensRequested();

      // Redirect to extension error page
      router.push('/extension/auth/error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      isExtensionLogin
        ? handleExtensionTokenGeneration()
        : router.push('/home');
    } else {
      setIsCheckingAuth(false);
    }
  }, [isAuthenticated, isExtensionLogin]);

  const handleOAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // validate form
    const isValid = form.validateField('handle');
    if (!isValid) return;

    try {
      setIsLoading(true);
      setError('');

      if (isExtensionLogin) {
        ExtensionService.setExtensionTokensRequested();
      }

      const { authUrl } = await apiClient.initiateOAuthSignIn({
        handle: form.values.handle,
      });

      window.location.href = authUrl;
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // validate
    const validation = form.validate();
    if (validation.hasErrors) return;

    try {
      setIsLoading(true);
      setError('');

      const { accessToken, refreshToken } =
        await apiClient.loginWithAppPassword({
          identifier: form.values.handle,
          appPassword: form.values.appPassword,
        });

      await setTokens(accessToken, refreshToken);

      if (isExtensionLogin) {
        await handleExtensionTokenGeneration();
      } else {
        router.push('/home');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const form = useForm({
    initialValues: {
      handle: '',
      appPassword: '',
      useAppPassword: false,
    },

    validate: {
      handle: (value) => (value.trim() ? null : 'Handle is required'),
      appPassword: (value, values) =>
        values.useAppPassword && value.trim() === ''
          ? 'App password is required'
          : null,
    },
  });

  if (form.values.useAppPassword) {
    return (
      <Stack gap={'lg'}>
        <form onSubmit={handleAppPasswordSubmit}>
          <Stack align="center">
            <TextInput
              label="Handle"
              placeholder="you.bsky.social"
              key={form.key('handle')}
              value={form.values.handle}
              onChange={(event) => {
                form.setFieldValue('handle', event.currentTarget.value);
                if (error) setError('');
              }}
              leftSection={<MdOutlineAlternateEmail size={22} />}
              variant="filled"
              size="lg"
              w={'100%'}
              required
            />
            <PasswordInput
              label="App password"
              placeholder="Your password"
              key={form.key('appPassword')}
              {...form.getInputProps('appPassword')}
              leftSection={<MdLock size={22} />}
              variant="filled"
              size="lg"
              w={'100%'}
              required
            />
            <Button
              type="submit"
              size="lg"
              color="dark"
              fullWidth
              rightSection={<BiRightArrowAlt size={22} />}
              loading={isLoading}
            >
              Log in
            </Button>
            {error && <Alert title={error} color="red" />}
          </Stack>
        </form>
        <Stack align="center">
          <UnstyledButton
            fw={500}
            onClick={() => {
              form.setFieldValue('useAppPassword', false);
              setError('');
            }}
          >
            Use OAuth login
          </UnstyledButton>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack gap={'xl'}>
      <form onSubmit={handleOAuthSubmit}>
        <Stack align="center">
          <TextInput
            label="Handle"
            placeholder="you.bsky.social"
            key={form.key('handle')}
            value={form.values.handle}
            onChange={(event) => {
              form.setFieldValue('handle', event.currentTarget.value);
              if (error) setError('');
            }}
            leftSection={<MdOutlineAlternateEmail size={22} />}
            variant="filled"
            size="lg"
            w={'100%'}
            required
          />
          <Button
            type="submit"
            size="lg"
            color="dark"
            fullWidth
            rightSection={<BiRightArrowAlt size={22} />}
            loading={isLoading}
          >
            Log in
          </Button>
          {error && <Alert title={error} color="red" />}
          <Text fw={500} c={'stone'}>
            Or
          </Text>
          <UnstyledButton
            fw={500}
            onClick={() => {
              form.setFieldValue('useAppPassword', true);
              setError('');
            }}
          >
            Use your app password
          </UnstyledButton>
        </Stack>
      </form>
    </Stack>
  );
}
