'use client';

import SignUpForm from '@/features/auth/components/signUpForm/SignUpForm';
import {
  Stack,
  Title,
  Text,
  Anchor,
  Image,
  Loader,
  Badge,
} from '@mantine/core';
import SembleLogo from '@/assets/semble-logo.svg';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isAuthenticated) {
      setIsRedirecting(true);

      // redirect after 1 second
      timeoutId = setTimeout(() => {
        router.push('/home');
      }, 1000);
    }

    // clean up
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <Stack align="center">
        <Loader type="dots" />
      </Stack>
    );
  }

  if (isRedirecting) {
    return (
      <Stack align="center">
        <Text fw={500} fz={'xl'}>
          Already logged in, redirecting you to library
        </Text>
        <Loader type="dots" />
      </Stack>
    );
  }

  return (
    <Stack align="center" gap="xl" maw={450}>
      <Stack gap={0}>
        <Stack gap={'xs'}>
          <Stack align="center" gap={'xs'}>
            <Image
              src={SembleLogo.src}
              alt="Semble logo"
              w={48}
              h={64.5}
              mx={'auto'}
            />
            <Badge size="sm">Alpha</Badge>
          </Stack>
          <Title order={1} ta="center">
            Welcome
          </Title>
        </Stack>
        <Text fz={'h3'} fw={700} ta={'center'} c={'stone'}>
          Sign up to get started
        </Text>
      </Stack>

      <Text fw={500} ta="center" maw={380}>
        When you sign up today, you’ll create a Bluesky account. In near future,
        your account will be seamlessly migrated to our{' '}
        <Anchor
          href="https://cosmik.network"
          target="_blank"
          fw={500}
          c={'blue'}
        >
          Cosmik Network
        </Anchor>
        .
      </Text>
      <SignUpForm />
    </Stack>
  );
}
