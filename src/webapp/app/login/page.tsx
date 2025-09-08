'use client';

import LoginForm from '@/features/auth/components/loginForm/LoginForm';
import {
  Stack,
  Title,
  Text,
  Image,
  Anchor,
  Popover,
  Button,
  PopoverTarget,
  PopoverDropdown,
  Loader,
} from '@mantine/core';
import { Suspense, useEffect, useState } from 'react';
import { IoMdHelpCircleOutline } from 'react-icons/io';
import SembleLogo from '@/assets/semble-logo.svg';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';

function InnerPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExtensionLogin = searchParams.get('extension-login') === 'true';

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isAuthenticated && !isExtensionLogin) {
      setIsRedirecting(true);

      // redirect after 1 second
      timeoutId = setTimeout(() => {
        router.push('/library');
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
    <Stack gap="xl" maw={300}>
      <Stack gap={'xs'}>
        <Image
          src={SembleLogo.src}
          alt="Semble logo"
          w={48}
          h={64.5}
          mx={'auto'}
        />
        <Title order={1} ta="center">
          Welcome back
        </Title>
      </Stack>
      <LoginForm />
      <Stack align="center" gap={0}>
        <Text fw={500} c={'stone'}>
          {"Don't have an account? "}
          <Anchor href="/signup" fw={500}>
            Sign up
          </Anchor>
        </Text>
        <Popover withArrow shadow="md">
          <PopoverTarget>
            <Button
              variant="white"
              size="md"
              fw={500}
              fs={'italic'}
              c={'stone'}
              rightSection={<IoMdHelpCircleOutline size={22} />}
            >
              How your Cosmik Network account works
            </Button>
          </PopoverTarget>
          <PopoverDropdown>
            <Text fw={500} ta="center" maw={380}>
              When you sign up today, you’ll create a Bluesky account. In near
              future, your account will be seamlessly migrated to our{' '}
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
          </PopoverDropdown>
        </Popover>
      </Stack>
    </Stack>
  );
}

export default function Page() {
  return (
    <Suspense>
      <InnerPage />
    </Suspense>
  );
}
