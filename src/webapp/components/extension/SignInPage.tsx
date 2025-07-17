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
  const form = useForm({
    initialValues: {
      handle: '',
      password: '',
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
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

      <form onSubmit={handleLogin}>
        <Stack>
          {error && <Alert color={'red'} title={error} />}

          <TextInput
            type="text"
            label="Handle"
            placeholder="user.bsky.social"
            disabled={isSubmitting}
            key={form.key('handle')}
            {...form.getInputProps('handle')}
          />

          <PasswordInput
            label="App Password"
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
        </Stack>
      </form>
    </Stack>
  );
}
