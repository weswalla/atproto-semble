import {
  Skeleton,
  Avatar,
  Group,
  Alert,
  Menu,
  Image,
  Button,
} from '@mantine/core';
import useMyProfile from '../../lib/queries/useMyProfile';
import CosmikLogo from '@/assets/cosmik-logo-full.svg';
import CosmikLogoWhite from '@/assets/cosmik-logo-full-white.svg';
import { MdBugReport } from 'react-icons/md';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IoMdLogOut } from 'react-icons/io';
import { useNavbarContext } from '@/providers/navbar';
import { BiSolidUserCircle } from 'react-icons/bi';
import { useColorScheme } from '@mantine/hooks';

export default function ProfileMenu() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { toggleMobile } = useNavbarContext();
  const { data, error, isPending } = useMyProfile();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (isPending || !data) {
    return <Skeleton w={38} h={38} radius={'md'} ml={4} />;
  }

  if (error) {
    return <Alert color="red" title="Could not load profile" />;
  }

  return (
    <Group>
      <Menu shadow="sm" width={280}>
        <Menu.Target>
          <Button
            variant="subtle"
            color={colorScheme === 'dark' ? 'gray' : 'dark'}
            fz={'md'}
            radius={'md'}
            size="lg"
            px={3}
            fullWidth={true}
            justify="start"
            leftSection={<Avatar src={data.avatarUrl} />}
          >
            {data.name}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            component={Link}
            href={`/profile/${data.handle}`}
            onClick={toggleMobile}
            leftSection={<BiSolidUserCircle size={22} />}
            color="gray"
          >
            View profile
          </Menu.Item>

          <Menu.Item
            component="a"
            href="https://tangled.org/@cosmik.network/semble/issues"
            target="_blank"
            leftSection={<MdBugReport size={22} />}
            color="gray"
          >
            Submit an issue
          </Menu.Item>

          <Menu.Item
            color="gray"
            leftSection={<IoMdLogOut size={22} />}
            onClick={handleLogout}
          >
            Log out
          </Menu.Item>

          <Menu.Divider />

          <Menu.Item
            component="a"
            href="https://cosmik.network/"
            target="_blank"
          >
            <Image
              src={
                colorScheme === 'dark' ? CosmikLogoWhite.src : CosmikLogo.src
              }
              alt="Cosmik logo"
              w={'auto'}
              h={24}
            />
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
