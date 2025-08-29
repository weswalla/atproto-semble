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
import Link from 'next/link';

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
    return <Skeleton w={38} h={38} radius={'md'} ml={4} />;
  }

  if (error) {
    return <Alert variant="white" color="red" title="Could not load profile" />;
  }

  return (
    <Group>
      <Menu shadow="sm" width={280}>
        <Menu.Target>
          <Group
            gap={'xs'}
            wrap="nowrap"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            w={'100%'}
          >
            <Avatar src={data.avatarUrl} ml={4} />
            <Text fw={500} lineClamp={1} truncate flex={1}>
              {data.name}
            </Text>
          </Group>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item component={Link} href="/profile">
            <Group gap={'xs'} wrap="nowrap">
              <Avatar src={data.avatarUrl} size={48} />
              <Stack gap={0}>
                <Text lineClamp={1} fw={500} style={{ wordBreak: 'break-all' }}>
                  {data.name}
                </Text>
                <Text fw={500} truncate="end" lineClamp={1} c={'gray'}>
                  View profile
                </Text>
              </Stack>
            </Group>
          </Menu.Item>

          <Menu.Divider />
          <Menu.Item
            component="a"
            href="https://cosmik.network/"
            target="_blank"
          >
            <Image src={CosmikLogo.src} alt="Cosmik logo" w={'auto'} h={24} />
          </Menu.Item>
          <Menu.Divider />

          <Menu.Item c={'red'} onClick={handleLogout}>
            Log out
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
