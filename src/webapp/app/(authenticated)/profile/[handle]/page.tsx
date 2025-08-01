'use client';

import { useParams } from 'next/navigation';
import { Stack, Title, Text, Card, Center } from '@mantine/core';

export default function ProfilePage() {
  const params = useParams();
  const handle = params.handle as string;

  return (
    <Center h={400}>
      <Card withBorder p="xl">
        <Stack align="center">
          <Title order={2}>Profile Page</Title>
          <Text c="dimmed">Profile for @{handle} - Coming Soon!</Text>
          <Text size="sm" c="dimmed">
            This page will show user profile information and their public
            activity.
          </Text>
        </Stack>
      </Card>
    </Center>
  );
}
