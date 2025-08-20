import {
  ActionIcon,
  Anchor,
  AppShellHeader,
  Group,
  Image,
} from '@mantine/core';
import SembleLogo from '@/assets/semble-logo.svg';
import { FiSidebar } from 'react-icons/fi';
import ProfileMenu from '@/features/profile/components/profileMenu/ProfileMenu';
import Link from 'next/link';

interface Props {
  onToggleNavbar: () => void;
}

export default function Header(props: Props) {
  return (
    <AppShellHeader withBorder={false}>
      <Group h="100%" px="sm" gap={'xs'} justify="space-between">
        <Group>
          <Anchor component={Link} href={'/library'}>
            <Image
              src={SembleLogo.src}
              alt="Semble logo"
              w={20.84}
              h={28}
              ml={'xs'}
            />
          </Anchor>
          <ActionIcon
            variant="subtle"
            color="gray"
            size={'lg'}
            radius={'xl'}
            onClick={props.onToggleNavbar}
          >
            <FiSidebar size={22} />
          </ActionIcon>
        </Group>
        <ProfileMenu />
      </Group>
    </AppShellHeader>
  );
}
