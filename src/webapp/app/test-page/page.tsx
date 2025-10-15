'use client';

import { useEffect, useState } from 'react';
import { Container, Stack, Title, Text, Code, Card, Alert, Loader, Button } from '@mantine/core';

interface UserProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
}

export default function TestPage() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      // Determine API base URL
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

      // Call the /me endpoint - cookies will be sent automatically
      const response = await fetch(`${apiBaseUrl}/api/users/me`, {
        method: 'GET',
        credentials: 'include', // Important: Include cookies in the request
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setAuthenticated(true);
      } else if (response.status === 401 || response.status === 403) {
        setAuthenticated(false);
        setError('Not authenticated - cookies not working or expired');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch profile');
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleRefresh = () => {
    fetchProfile();
  };

  const handleLogout = async () => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

      await fetch(`${apiBaseUrl}/api/users/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Refresh the page state
      fetchProfile();
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={1}>Cookie Authentication Test Page</Title>

        <Text c="dimmed">
          This page tests cookie-based authentication by calling the <Code>/api/users/me</Code> endpoint.
          If cookies are working correctly, your profile information will be displayed below.
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

        {error && (
          <Alert title="Error Details" color="orange">
            <Code block>{error}</Code>
          </Alert>
        )}

        {profile && (
          <Card withBorder>
            <Stack gap="xs">
              <Title order={3}>Profile Information</Title>

              <div>
                <Text fw={600} size="sm">DID:</Text>
                <Code block>{profile.did}</Code>
              </div>

              <div>
                <Text fw={600} size="sm">Handle:</Text>
                <Code>{profile.handle}</Code>
              </div>

              {profile.displayName && (
                <div>
                  <Text fw={600} size="sm">Display Name:</Text>
                  <Text>{profile.displayName}</Text>
                </div>
              )}

              {profile.description && (
                <div>
                  <Text fw={600} size="sm">Description:</Text>
                  <Text>{profile.description}</Text>
                </div>
              )}

              {profile.avatar && (
                <div>
                  <Text fw={600} size="sm">Avatar URL:</Text>
                  <Code block>{profile.avatar}</Code>
                </div>
              )}
            </Stack>
          </Card>
        )}

        <Stack gap="xs">
          <Button onClick={handleRefresh} variant="light">
            Refresh Test
          </Button>

          {authenticated && (
            <Button onClick={handleLogout} variant="outline" color="red">
              Test Logout (Clear Cookies)
            </Button>
          )}

          {!authenticated && (
            <Button
              component="a"
              href="/login"
              variant="filled"
            >
              Go to Login
            </Button>
          )}
        </Stack>

        <Card withBorder bg="gray.0">
          <Stack gap="xs">
            <Title order={4}>How This Test Works</Title>
            <Text size="sm">
              1. This page makes a request to <Code>/api/users/me</Code>
            </Text>
            <Text size="sm">
              2. The request includes <Code>credentials: 'include'</Code> to send cookies
            </Text>
            <Text size="sm">
              3. The backend reads the access token from the cookie
            </Text>
            <Text size="sm">
              4. If valid, it returns your profile information
            </Text>
            <Text size="sm">
              5. Success = cookies are working correctly! ✅
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
