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
} from '@mantine/core';
import { LuLibrary } from 'react-icons/lu';
import { MdOutlineEmojiNature } from 'react-icons/md';
import { FaRegNoteSticky } from 'react-icons/fa6';
import Link from 'next/link';
import SembleLogo from '@/assets/semble-logo.svg';
import ProfileMenu from '@/features/profile/components/profileMenu/ProfileMenu';

export default function Navbar() {
  return (
    <AppShellNavbar px={'md'} pb={'md'} pt={'xs'}>
      <Group justify="space-between" ml={'sm'}>
        <Anchor component={Link} href={'/library'}>
          <Image src={SembleLogo.src} alt="Semble logo" w={20.84} h={28} />
        </Anchor>
        <ProfileMenu />
      </Group>

      <AppShellSection grow component={ScrollArea}>
        <Stack gap={5} mt={'lg'}>
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
        <CollectionsNavList />
      </AppShellSection>
    </AppShellNavbar>
  );
}
