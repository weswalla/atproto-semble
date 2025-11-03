import { AppShellFooter, Avatar, Group } from '@mantine/core';
import { FaRegNoteSticky } from 'react-icons/fa6';
import { LuLibrary } from 'react-icons/lu';
import { MdOutlineEmojiNature } from 'react-icons/md';
import NavbarToggle from '../NavbarToggle';
import BottomBarItem from '../bottomBarItem/BottomBarItem';
import useMyProfile from '@/features/profile/lib/queries/useMyProfile';

export default function BottomBar() {
  const { data: profile } = useMyProfile();

  return (
    <AppShellFooter px={'sm'} pb={'lg'} hiddenFrom="sm">
      <Group align="center" justify="space-around" gap={'lg'} h={'100%'}>
        <BottomBarItem href="/home" icon={LuLibrary} />
        <BottomBarItem href="/explore" icon={MdOutlineEmojiNature} />
        <BottomBarItem
          href={`/profile/${profile.handle}/cards`}
          icon={FaRegNoteSticky}
        />
        <BottomBarItem
          href={`/profile/${profile.handle}`}
          icon={<Avatar src={profile.avatarUrl} />}
        />
      </Group>
    </AppShellFooter>
  );
}
