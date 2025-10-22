import {
  Container,
  Stack,
  Image,
  Text,
  Anchor,
  ActionIcon,
  Box,
  Button,
  Group,
} from '@mantine/core';
import CosmikLogo from '@/assets/cosmik-logo-full.svg';
import SembleLogo from '@/assets/semble-logo.svg';
import { Metadata } from 'next';
import Link from 'next/link';
import { FaBluesky, FaGithub, FaDiscord } from 'react-icons/fa6';
import { RiArrowRightUpLine } from 'react-icons/ri';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `Follow your peers' research trails. Surface and discover new connections. Built on ATProto so you own your data.`,
};

interface Props {
  children: React.ReactNode;
}

export default function Layout(props: Props) {
  return (
    <Container p="md" size="sm">
      <Stack align="start">
        <Anchor component={Link} href={'/'}>
          <Image src={SembleLogo.src} alt="Semble logo" w={'auto'} h={50} />
        </Anchor>
        <Stack>{props.children}</Stack>
        <Box component="footer" px={'md'} py={'xs'} mt={'xl'} mx={'auto'}>
          <Button
            component={Link}
            href="/"
            variant="light"
            color="dark.1"
            fw={600}
          >
            Back to home
          </Button>
        </Box>
      </Stack>
    </Container>
  );
}
