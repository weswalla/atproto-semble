import CollectionsNavList from '@/features/collections/components/collectionsNavList/CollectionsNavList';
import NavItem from '../navItem/NavItem';
import {
  AppShellSection,
  AppShellNavbar,
  ScrollArea,
  Divider,
  Stack,
  Group,
  Anchor,
  Image,
  Box,
} from '@mantine/core';
import { LuLibrary } from 'react-icons/lu';
import { MdOutlineEmojiNature } from 'react-icons/md';
import { FaRegNoteSticky } from 'react-icons/fa6';
import Link from 'next/link';
import SembleLogo from '@/assets/semble-logo.svg';
import ProfileMenu from '@/features/profile/components/profileMenu/ProfileMenu';
import { Suspense } from 'react';
import CollectionsNavListSkeleton from '@/features/collections/components/collectionsNavList/Skeleton.CollectionsNavList';
import NavbarToggle from '../NavbarToggle';

export default function Navbar() {
  return (
    <AppShellNavbar px={'md'} pb={'md'} pt={'xs'}>
      <Group justify="space-between" ml={'sm'}>
        <Anchor component={Link} href={'/library'}>
          <Image src={SembleLogo.src} alt="Semble logo" w={20.84} h={28} />
        </Anchor>
        <Box hiddenFrom="xs">
          <NavbarToggle />
        </Box>
      </Group>

      <AppShellSection grow component={ScrollArea}>
        <Stack gap={5} mt={'xl'}>
          <ProfileMenu />
          <NavItem
            href="/library"
            label="Library"
            icon={<LuLibrary size={25} />}
          />
          <NavItem
            href="/my-cards"
            label="My Cards"
            icon={<FaRegNoteSticky size={25} />}
          />
          <NavItem
            href="/explore"
            label="Explore"
            icon={<MdOutlineEmojiNature size={25} />}
          />
        </Stack>

        <Divider my={'sm'} />
        <Suspense fallback={<CollectionsNavListSkeleton />}>
          <CollectionsNavList />
        </Suspense>
      </AppShellSection>
    </AppShellNavbar>
  );
}
