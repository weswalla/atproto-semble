import {
  Skeleton,
  Avatar,
  Group,
  Alert,
  Menu,
  Stack,
  Image,
  Text,
} from '@mantine/core';
import useMyProfile from '../../lib/queries/useMyProfile';
import CosmikLogo from '@/assets/cosmik-logo-full.svg';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function ProfileMenu() {
  const router = useRouter();
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
    return <Skeleton w={38} h={38} radius={'md'} />;
  }

  if (error) {
    return (
      <Alert variant="white" color="red" title="Could not load collections" />
    );
  }

  return (
    <Group>
      <Menu shadow="sm" width={250}>
        <Menu.Target>
          <Avatar src={data.avatarUrl} />
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item component="a" href="/profile">
            <Stack gap={0} w={'80%'}>
              <Text truncate="end" lineClamp={1} fw={500}>
                {data.name}
              </Text>
              <Text fw={500} truncate="end" c={'gray'}>
                {data.handle}
              </Text>
            </Stack>
          </Menu.Item>

          <Menu.Divider />
          <Menu.Item c={'red'} onClick={handleLogout}>
            Log out
          </Menu.Item>
          <Menu.Divider />

          <Menu.Item
            component="a"
            href="https://cosmik.network/"
            target="_blank"
          >
            <Image src={CosmikLogo.src} alt="Cosmik logo" w={'auto'} h={24} />
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
