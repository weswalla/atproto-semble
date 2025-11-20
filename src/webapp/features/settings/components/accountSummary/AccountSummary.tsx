'use client';

import useMyProfile from '@/features/profile/lib/queries/useMyProfile';
import { Avatar, Card, Group, Stack, Text } from '@mantine/core';

export default function AccountSummary() {
  const { data: profile } = useMyProfile();

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
      </Group>
    </Card>
  );
}
