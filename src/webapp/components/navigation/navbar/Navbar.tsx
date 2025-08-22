import CollectionsNavList from '@/features/collections/components/collectionsNavList/CollectionsNavList';
import NavItem from '../navItem/NavItem';
import {
  AppShellSection,
  AppShellNavbar,
  ScrollArea,
  Divider,
  Stack,
} from '@mantine/core';
import { LuLibrary } from 'react-icons/lu';
import { MdOutlineEmojiNature } from 'react-icons/md';

export default function Navbar() {
  return (
    <AppShellNavbar withBorder={false}>
      <AppShellSection
        grow
        component={ScrollArea}
        px={'md'}
        pb={'md'}
        pt={'xs'}
      >
        <Stack gap={5}>
          <NavItem
            href="/library"
            label="Library"
            icon={<LuLibrary size={25} />}
            activeIcon={<LuLibrary size={25} />}
          />
          <NavItem
            href="/explore"
            label="Explore"
            icon={<MdOutlineEmojiNature size={25} />}
            activeIcon={<MdOutlineEmojiNature size={25} />}
          />
        </Stack>

        <Divider my={'sm'} />
        <CollectionsNavList />
      </AppShellSection>

      {/*<AppShellSection p={'md'}></AppShellSection>*/}
    </AppShellNavbar>
  );
}
