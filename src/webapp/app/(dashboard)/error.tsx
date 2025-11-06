'use client';

import {
  BackgroundImage,
  Center,
  Stack,
  Image,
  Badge,
  Text,
  Group,
  Button,
  Container,
} from '@mantine/core';
import SembleLogo from '@/assets/semble-logo.svg';
import BG from '@/assets/semble-bg.webp';
import DarkBG from '@/assets/semble-bg-dark.png';
import Link from 'next/link';
import { BiRightArrowAlt } from 'react-icons/bi';
import { useColorScheme } from '@mantine/hooks';

export default function Error() {
  const colorScheme = useColorScheme();

  return (
    <BackgroundImage
      src={colorScheme === 'dark' ? DarkBG.src : BG.src}
      h={'100svh'}
      pos={'fixed'}
      top={0}
      left={0}
      style={{ zIndex: 102 }}
    >
      <Center h={'100svh'} py={{ base: '2rem', xs: '5rem' }}>
        <Container size={'xl'} p={'md'} my={'auto'}>
          <Stack>
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

            <Stack>
              <Text fz={'h1'} fw={600} ta={'center'}>
                A social knowledge network for researchers
              </Text>
              <Text
                fz={'h3'}
                fw={600}
                c={colorScheme === 'dark' ? '#1e4dd9' : '#1F6144'}
                ta={'center'}
              >
                Follow your peers’ research trails. Surface and discover new
                connections. Built on ATProto so you own your data.
              </Text>
            </Stack>

            <Group justify="center" gap="md" mt={'lg'}>
              <Button component={Link} href="/signup" size="lg">
                Sign up
              </Button>

              <Button
                component={Link}
                href="/login"
                size="lg"
                color="dark"
                rightSection={<BiRightArrowAlt size={22} />}
              >
                Log in
              </Button>
            </Group>
          </Stack>
        </Container>
      </Center>
    </BackgroundImage>
  );
}
