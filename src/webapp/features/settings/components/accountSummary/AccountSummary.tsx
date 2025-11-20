'use client';

import useMyProfile from '@/features/profile/lib/queries/useMyProfile';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, Button, Card, Group, Stack, Text } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { IoMdLogOut } from 'react-icons/io';

export default function AccountSummary() {
  const { data: profile } = useMyProfile();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Card p={'xs'} radius={'lg'} withBorder>
      <Group gap={'xs'} justify="space-between">
        <Group gap={'xs'}>
          <Avatar
            src={profile.avatarUrl}
            alt={`${profile.name}'s' avatar`}
            size={'lg'}
          />
          <Stack gap={0}>
            <Text fw={600} fz={'xl'} c={'bright'}>
              {profile.name}
            </Text>
            <Text fw={600} c={'gray'}>
              {profile.handle}
            </Text>
          </Stack>
        </Group>

        <Button
          leftSection={<IoMdLogOut size={22} />}
          variant="light"
          color="red"
          onClick={handleLogout}
        >
          Log out
        </Button>
      </Group>
    </Card>
  );
}
