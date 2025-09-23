- use the `getAccessTokenInServerComponent()` to access the token
- pass the token in to the `ApiClient` as normal

```tsx
const accessToken = await getAccessTokenInServerComponent();
const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
  () => accessToken,
);
```

- Full example

```tsx
import { ApiClient } from '@/api-client/ApiClient';
import { getAccessTokenInServerComponent } from '@/services/auth';
import {
  Card,
  Container,
  Stack,
  Title,
  Text,
  Avatar,
  Group,
} from '@mantine/core';
import { redirect } from 'next/navigation';

export default async function SSRProfilePage() {
  const accessToken = await getAccessTokenInServerComponent();
  if (!accessToken) {
    redirect('/auth/signin');
  }

  // Create API client for server-side usage
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => accessToken,
  );

  let profile;
  let error;

  try {
    profile = await apiClient.getMyProfile();
    console.log('Fetched profile on server side:', profile);
  } catch (err: any) {
    console.error('Error fetching profile on server side:', err);
    error = err.message || 'Failed to load profile';
  }

  return (
    <Container p="xs" size="md">
      <Stack>
        <Title order={1}>Server-Side Rendered Profile</Title>

        {error ? (
          <Card withBorder p="xl">
            <Text c="red" ta="center">
              Error: {error}
            </Text>
          </Card>
        ) : profile ? (
          <Card withBorder p="xl">
            <Stack align="center" gap="md">
              <Avatar
                src={profile.avatarUrl}
                alt={profile.name}
                size="xl"
                radius="md"
              />

              <Stack align="center" gap="xs">
                <Title order={2}>{profile.name}</Title>
                <Text c="dimmed" size="lg">
                  @{profile.handle}
                </Text>

                {profile.description && (
                  <Text ta="center" maw={400}>
                    {profile.description}
                  </Text>
                )}
              </Stack>

              <Group gap="md" mt="md">
                <Text size="sm" c="dimmed">
                  <strong>ID:</strong> {profile.id}
                </Text>
              </Group>
            </Stack>
          </Card>
        ) : (
          <Card withBorder p="xl">
            <Text ta="center" c="dimmed">
              No profile data available
            </Text>
          </Card>
        )}

        <Text size="sm" c="dimmed" ta="center">
          This page was rendered on the server at {new Date().toISOString()}
        </Text>
      </Stack>
    </Container>
  );
}
```
