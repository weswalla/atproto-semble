import NavItem from '../navItem/NavItem';
import {
  AppShellSection,
  AppShellNavbar,
  ScrollArea,
  Divider,
} from '@mantine/core';
import { IoDocumentTextOutline } from 'react-icons/io5';
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
        <NavItem
          href="/library"
          label="Library"
          icon={<IoDocumentTextOutline size={25} />}
          activeIcon={<IoDocumentTextOutline size={25} />}
        />
        <NavItem
          href="/explore"
          label="Explore"
          icon={<MdOutlineEmojiNature size={25} />}
          activeIcon={<MdOutlineEmojiNature size={25} />}
        />

        <Divider my={'sm'} />
        {/*<FeedNavList />
        <ListNavList />
        <ChatNavList />*/}
      </AppShellSection>

      <AppShellSection p={'md'}></AppShellSection>
    </AppShellNavbar>
  );
}
