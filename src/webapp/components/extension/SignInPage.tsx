'use client';

import { useState } from 'react';
import { useExtensionAuth } from '../../hooks/useExtensionAuth';
import {
  Alert,
  Button,
  Center,
  Divider,
  Loader,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';

export function SignInPage() {
  const { loginWithAppPassword, error, isLoading } = useExtensionAuth();
  const [useAppPassword, setUseAppPassword] = useState(false);
  const form = useForm({
    initialValues: {
      handle: '',
      password: '',
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.getValues().handle.trim()) return;

    try {
      setIsSubmitting(true);
      
      // Open the main app login page with extension login flag
      const appUrl = process.env.PLASMO_PUBLIC_APP_URL || 'http://localhost:3000';
      const loginUrl = `${appUrl}/login?extension-login=true`;
      chrome.tabs.create({ url: loginUrl });
      window.close();
    } catch (error) {
      // Error handling if needed
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.getValues().handle.trim() || !form.getValues().password.trim())
      return;

    try {
      setIsSubmitting(true);
      await loginWithAppPassword(
        form.getValues().handle.trim(),
        form.getValues().password.trim(),
      );
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Center>
        <Loader />
      </Center>
    );
  }

  return (
    <Stack>
      <Stack gap={0}>
        <Title order={1} fz={'xl'}>
          Card Extension
        </Title>
        <Text c={'gray'} fz={'sm'} fw={500}>
          Sign in to save content
        </Text>
      </Stack>

      <Divider />

      {!useAppPassword ? (
        <form onSubmit={handleOAuthSubmit}>
          <Stack>
            {error && <Alert color={'red'} title={error} />}

            <TextInput
              type="text"
              label="Enter your Bluesky handle"
              placeholder="user.bsky.social"
              disabled={isSubmitting}
              key={form.key('handle')}
              {...form.getInputProps('handle')}
            />

            <Button
              type="submit"
              disabled={!form.getValues().handle.trim() || isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Connecting...' : 'Continue'}
            </Button>

            <Button
              type="button"
              onClick={() => setUseAppPassword(true)}
              variant="transparent"
              color="blue"
            >
              Sign in with app password
            </Button>
          </Stack>
        </form>
      ) : (
        <form onSubmit={handleAppPasswordSubmit}>
          <Stack>
            {error && <Alert color={'red'} title={error} />}

            <TextInput
              type="text"
              label="Bluesky handle"
              placeholder="user.bsky.social"
              disabled={isSubmitting}
              key={form.key('handle')}
              {...form.getInputProps('handle')}
            />

            <PasswordInput
              label="App password"
              placeholder="xxxx-xxxx-xxxx-xxxx"
              disabled={isSubmitting}
              key={form.key('password')}
              {...form.getInputProps('password')}
            />

            <Button
              type="submit"
              disabled={
                !form.getValues().handle.trim() ||
                !form.getValues().password.trim() ||
                isSubmitting
              }
              loading={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>

            <Button
              type="button"
              onClick={() => setUseAppPassword(false)}
              variant="transparent"
              color="blue"
            >
              Back to regular sign in
            </Button>
          </Stack>
        </form>
      )}
    </Stack>
  );
}
