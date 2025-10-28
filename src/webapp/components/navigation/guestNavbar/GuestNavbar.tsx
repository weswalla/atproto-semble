import NavItem from '../navItem/NavItem';
import {
  AppShellSection,
  AppShellNavbar,
  ScrollArea,
  Stack,
  Group,
  Anchor,
  Image,
  Box,
  Badge,
} from '@mantine/core';
import { LuLibrary } from 'react-icons/lu';
import { MdOutlineEmojiNature } from 'react-icons/md';
import Link from 'next/link';
import SembleLogo from '@/assets/semble-logo.svg';
import NavbarToggle from '../NavbarToggle';

export default function GuestNavbar() {
  return (
    <AppShellNavbar p={'xs'} style={{ zIndex: 3 }}>
      <Group justify="space-between">
        <Anchor component={Link} href={'/home'}>
          <Stack align="center" gap={6}>
            <Image src={SembleLogo.src} alt="Semble logo" w={20.84} h={28} />
            <Badge size="xs">Alpha</Badge>
          </Stack>
        </Anchor>
        <Box hiddenFrom="xs">
          <NavbarToggle />
        </Box>
      </Group>

      <AppShellSection grow component={ScrollArea}>
        <Stack mt={'xl'}>
          <Stack gap={5}>
            <NavItem href="/home" label="Home" icon={<LuLibrary size={25} />} />
            <NavItem
              href="/explore"
              label="Explore"
              icon={<MdOutlineEmojiNature size={25} />}
            />
          </Stack>
        </Stack>
      </AppShellSection>
    </AppShellNavbar>
  );
}
