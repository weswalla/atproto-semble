import { getServerAuthStatus } from '@/lib/serverAuth';
import {
  Container,
  Stack,
  Title,
  Text,
  Code,
  Card,
  Alert,
  Button,
} from '@mantine/core';

export default async function TestServerPage() {
  const { isAuthenticated: authenticated, user: profile, error } = await getServerAuthStatus();

  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={1}>Server-Side Cookie Authentication Test</Title>

        <Text c="dimmed">
          This page tests cookie-based authentication on the server side by
          reading cookies with Next.js <Code>cookies()</Code> and calling the{' '}
          <Code>/api/users/me</Code> endpoint during server-side rendering.
        </Text>

        {authenticated && profile && (
          <Alert title="✅ Server-Side Authentication Successful" color="green">
            <Text>
              Cookies are working on the server side! You are authenticated.
            </Text>
          </Alert>
        )}

        {!authenticated && (
          <Alert title="❌ Server-Side Authentication Failed" color="red">
            <Text>
              Server-side cookie authentication failed or you are not
              authenticated.
            </Text>
            <Text size="sm" mt="xs">
              Please log in first, then return to this page.
            </Text>
          </Alert>
        )}

        {error && (
          <Alert title="Error Details" color="orange">
            <Code block>{error}</Code>
          </Alert>
        )}

        {profile && (
          <Card withBorder>
            <Stack gap="xs">
              <Title order={3}>Profile Information (Server-Side)</Title>

              <div>
                <Text fw={600} size="sm">
                  DID:
                </Text>
                <Code block>{profile.did}</Code>
              </div>

              <div>
                <Text fw={600} size="sm">
                  Handle:
                </Text>
                <Code>{profile.handle}</Code>
              </div>

              {profile.displayName && (
                <div>
                  <Text fw={600} size="sm">
                    Display Name:
                  </Text>
                  <Text>{profile.displayName}</Text>
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

              {profile.avatar && (
                <div>
                  <Text fw={600} size="sm">
                    Avatar URL:
                  </Text>
                  <Code block>{profile.avatar}</Code>
                </div>
              )}
            </Stack>
          </Card>
        )}

        <Stack gap="xs">
          <Button component="a" href="/test-server-page" variant="light">
            Refresh Page (Server-Side)
          </Button>

          <Button component="a" href="/test-page" variant="outline">
            Compare with Client-Side Test
          </Button>

          {!authenticated && (
            <Button component="a" href="/login" variant="filled">
              Go to Login
            </Button>
          )}
        </Stack>

        <Card withBorder bg="gray.0">
          <Stack gap="xs">
            <Title order={4}>How This Server-Side Test Works</Title>
            <Text size="sm">
              1. This page runs on the server during SSR/SSG
            </Text>
            <Text size="sm">
              2. It reads cookies using Next.js <Code>cookies()</Code> function
            </Text>
            <Text size="sm">
              3. It makes a server-to-server request to{' '}
              <Code>/api/users/me</Code>
            </Text>
            <Text size="sm">
              4. The API client automatically includes the cookie value in the Cookie header
            </Text>
            <Text size="sm">
              5. The backend validates the token and returns profile data
            </Text>
            <Text size="sm">
              6. Success = server-side cookie authentication works! ✅
            </Text>
          </Stack>
        </Card>

        <Card withBorder bg="blue.0">
          <Stack gap="xs">
            <Title order={4}>Server vs Client Side Differences</Title>
            <Text size="sm">
              <strong>Server-side:</strong> Cookies are read during page
              generation, authentication happens before the page is sent to the
              browser
            </Text>
            <Text size="sm">
              <strong>Client-side:</strong> Cookies are sent automatically with
              fetch requests, authentication happens in the browser after page
              load
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
