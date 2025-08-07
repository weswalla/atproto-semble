'use client';

import {
  Title,
  Text,
  Stack,
  Button,
  Center,
  Card,
  Box,
  Group,
} from '@mantine/core';
import { FaExternalLinkAlt } from 'react-icons/fa';

export default function SignupPage() {
  return (
    <Center h={'100svh'}>
      <Card withBorder w={500} p="xl">
        <Stack align="center" gap="lg">
          <Title order={1} ta="center">
            Welcome to Semble
          </Title>

          <Text ta="center" c="dimmed" fz="lg">
            A social knowledge tool for researchers
          </Text>

          <Box
            style={{
              backgroundColor: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
            }}
          >
            <Stack gap="md">
              <Text fw={500} ta="center">
                Bluesky Account Required
              </Text>
              <Text fz="sm" ta="center" c="dimmed">
                Semble is built on ATProto and requires a Bluesky account to
                use. This ensures you own your data and can take it with you
                anywhere.
              </Text>
            </Stack>
          </Box>

          <Stack gap="sm" w="100%">
            <Text fw={500} ta="center">
              Already have a Bluesky account?
            </Text>
            <Button
              component="a"
              href="/login"
              size="lg"
              fullWidth
              style={{
                backgroundColor: '#FF4500',
                color: '#FFF',
              }}
            >
              Sign in to Semble
            </Button>
          </Stack>

          <Stack gap="sm" w="100%">
            <Text fw={500} ta="center">
              Need a Bluesky account?
            </Text>
            <Button
              component="a"
              href="https://bsky.app"
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              variant="outline"
              fullWidth
              rightSection={<FaExternalLinkAlt size={14} />}
              style={{
                borderColor: '#0085ff',
                color: '#0085ff',
              }}
            >
              Create account on Bluesky
            </Button>
          </Stack>

          <Group gap="xs" mt="md">
            <Text fz="sm" c="dimmed">
              Already have an account?
            </Text>
            <Text
              component="a"
              href="/login"
              fz="sm"
              c="#FF4500"
              style={{
                textDecoration: 'none',
                cursor: 'pointer',
              }}
              styles={{
                root: {
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                },
              }}
            >
              Sign in here
            </Text>
          </Group>
        </Stack>
      </Card>
    </Center>
  );
}
