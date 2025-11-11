'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Stack, Loader, Text } from '@mantine/core';

export default function LogoutPage() {
  const { logout } = useAuth();

  useEffect(() => {
    logout().catch((error) => {
      console.error('Logout error:', error);
      // Force redirect if logout fails
      window.location.href = '/';
    });
  }, [logout]);

  return (
    <Stack align="center" gap="md" mt="xl">
      <Loader type="dots" />
      <Text>Logging you out...</Text>
    </Stack>
  );
}
