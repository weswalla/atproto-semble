import { AppShellFooter, Avatar, Group } from '@mantine/core';
import { LuLibrary } from 'react-icons/lu';
import { MdOutlineEmojiNature } from 'react-icons/md';
import BottomBarItem from '../bottomBarItem/BottomBarItem';
import Link from 'next/link';

export default function GuestBottomBar() {
  return (
    <AppShellFooter px={'sm'} pb={'lg'} py={'xs'} hiddenFrom="sm">
      <Group align="start" justify="space-around" gap={'lg'} h={'100%'}>
        <BottomBarItem href="/home" icon={LuLibrary} />
        <BottomBarItem href="/explore" icon={MdOutlineEmojiNature} />
        <Avatar component={Link} href={'/login'} />
      </Group>
    </AppShellFooter>
  );
}
