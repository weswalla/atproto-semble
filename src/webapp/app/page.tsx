'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Title, Text, Stack, Button, Center } from '@mantine/core';
import { FaBluesky } from 'react-icons/fa6';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/library');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <>Loading...</>;
  }

  return (
    <Center h={'100svh'}>
      <Stack align="center">
        <Stack align="center" gap={0}>
          <Title order={1}>Welcome to Semble</Title>
          <Text fw={600} fz={'xl'} c={'dark.4'}>
            A social knowledge tool for researchers
          </Text>
        </Stack>

        <Stack align="center">
          <Button component="a" href="/login" leftSection={<FaBluesky />}>
            Sign in with Bluesky
          </Button>
        </Stack>
      </Stack>
    </Center>
  );
}
