'use client';

import { useAuth } from '@/hooks/useAuth';
import { ClientCookieAuthService } from '@/services/auth';
import {
  Container,
  Stack,
  Title,
  Text,
  Code,
  Card,
  Alert,
  Loader,
  Button,
} from '@mantine/core';

export default function TestPage() {
  const {
    isAuthenticated: authenticated,
    user: profile,
    isLoading: loading,
    refreshAuth,
    logout,
  } = useAuth();

  const handleRefresh = () => {
    refreshAuth();
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleCheckAuth = async () => {
    const isAuth = await ClientCookieAuthService.checkAuthStatus();
    console.log('Auth check:', { isAuthenticated: isAuth });
  };

  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={1}>Cookie Authentication Test Page</Title>

        <Text c="dimmed">
          This page tests cookie-based authentication by calling the{' '}
          <Code>/api/users/me</Code> endpoint. If cookies are working correctly,
          your profile information will be displayed below.
        </Text>

        {loading && (
          <Card withBorder>
            <Stack align="center" gap="sm">
              <Loader size="md" />
              <Text>Testing cookie authentication...</Text>
            </Stack>
          </Card>
        )}

        {!loading && authenticated && profile && (
          <Alert title="✅ Authentication Successful" color="green">
            <Text>Cookies are working! You are authenticated.</Text>
          </Alert>
        )}

        {!loading && !authenticated && (
          <Alert title="❌ Authentication Failed" color="red">
            <Text>Cookies are not working or you are not authenticated.</Text>
            <Text size="sm" mt="xs">
              Please log in first, then return to this page.
            </Text>
          </Alert>
        )}

        {profile && (
          <Card withBorder>
            <Stack gap="xs">
              <Title order={3}>Profile Information</Title>

              <div>
                <Text fw={600} size="sm">
                  DID:
                </Text>
                <Code block>{profile.id}</Code>
              </div>

              <div>
                <Text fw={600} size="sm">
                  Handle:
                </Text>
                <Code>{profile.handle}</Code>
              </div>

              {profile.name && (
                <div>
                  <Text fw={600} size="sm">
                    Name:
                  </Text>
                  <Text>{profile.name}</Text>
                </div>
              )}

              {profile.description && (
                <div>
                  <Text fw={600} size="sm">
                    Description:
                  </Text>
                  <Text>{profile.description}</Text>
                </div>
              )}

              {profile.avatarUrl && (
                <div>
                  <Text fw={600} size="sm">
                    Avatar URL:
                  </Text>
                  <Code block>{profile.avatarUrl}</Code>
                </div>
              )}
            </Stack>
          </Card>
        )}

        <Stack gap="xs">
          <Button onClick={handleRefresh} variant="light">
            Refresh Test
          </Button>

          <Button onClick={handleCheckAuth} variant="outline">
            Check Auth Status (Console)
          </Button>

          {authenticated && (
            <Button onClick={handleLogout} variant="outline" color="red">
              Test Logout (Clear Cookies)
            </Button>
          )}

          {!authenticated && (
            <Button component="a" href="/login" variant="filled">
              Go to Login
            </Button>
          )}
        </Stack>

        <Card withBorder bg="gray.0">
          <Stack gap="xs">
            <Title order={4}>How This Client-Side Test Works</Title>
            <Text size="sm">
              1. This page uses the <Code>useAuth</Code> hook
            </Text>
            <Text size="sm">
              2. Cookies are HttpOnly and cannot be read from JavaScript
            </Text>
            <Text size="sm">
              3. The browser automatically sends cookies with{' '}
              <Code>credentials: 'include'</Code>
            </Text>
            <Text size="sm">
              4. Auth status is checked via API endpoint
            </Text>
            <Text size="sm">
              5. Success = client-side cookie authentication works! ✅
            </Text>
          </Stack>
        </Card>

        <Card withBorder bg="blue.0">
          <Stack gap="xs">
            <Title order={4}>Client vs Server Side Differences</Title>
            <Text size="sm">
              <strong>Client-side:</strong> Cookies are sent automatically with
              fetch requests, authentication happens in the browser after page
              load
            </Text>
            <Text size="sm">
              <strong>Server-side:</strong> Cookies are read during page
              generation, authentication happens before the page is sent to the
              browser
            </Text>
            <Text size="sm">
              Both approaches should work if cookies are configured correctly!
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
