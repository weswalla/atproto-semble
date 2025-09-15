import {
  Skeleton,
  Avatar,
  Group,
  Alert,
  Menu,
  Stack,
  Image,
  Text,
  Button,
} from '@mantine/core';
import useMyProfile from '../../lib/queries/useMyProfile';
import CosmikLogo from '@/assets/cosmik-logo-full.svg';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MdLogout } from 'react-icons/md';

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
    return <Alert color="red" title="Could not load profile" />;
  }

  return (
    <Group>
      <Menu shadow="sm" width={280}>
        <Menu.Target>
          <Button
            variant="subtle"
            color="gray"
            c={'dark'}
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
          <Menu.Item component={Link} href="/profile">
            <Group gap={'xs'} wrap="nowrap">
              <Avatar src={data.avatarUrl} size={48} />
              <Stack gap={0}>
                <Text fw={500} lineClamp={1} style={{ wordBreak: 'break-all' }}>
                  {data.name}
                </Text>
                <Text fw={500} lineClamp={1} flex={1} c={'gray'}>
                  {data.handle}
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

          <Menu.Item
            c={'red'}
            leftSection={<MdLogout />}
            onClick={handleLogout}
          >
            Log out
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
