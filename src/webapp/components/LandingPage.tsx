'use client';

import { Title, Text, Stack, Button, Box, Container, Group, Flex } from '@mantine/core';
import { FaGithub, FaDiscord } from 'react-icons/fa6';

// Simple icon components
const GridIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

const NetworkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="6" cy="6" r="3" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="12" cy="18" r="3" />
    <path d="M9 6h6M10.5 15l3-9M13.5 15l-3-9" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

const DatabaseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

const LinkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

const CosmikIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const ButterflyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8 2 5 5 5 9c0 2 1 4 3 5-2 1-3 3-3 5 0 4 3 7 7 7s7-3 7-7c0-2-1-4-3-5 2-1 3-3 3-5 0-4-3-7-7-7z" />
  </svg>
);

export default function LandingPage() {
  return (
    <Box
      style={{
        minHeight: '100vh',
        backgroundImage: 'url(/riverbed-background.jpg)', // You'll need to add this image
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
      }}
    >
      {/* Semi-transparent overlay */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(76, 175, 80, 0.55)', // Greenish tint
        }}
      />

      {/* Content */}
      <Box style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Container size="xl">
          <Flex justify="space-between" align="center" style={{ padding: '1rem 2rem' }}>
            <Text
              fw={700}
              fz="1.25rem"
              tt="uppercase"
              c="#FF4500"
              style={{ fontFamily: 'sans-serif' }}
            >
              SEMBLE
            </Text>
            <Group gap="sm">
              <Button
                component="a"
                href="/signup"
                radius="xl"
                style={{
                  backgroundColor: '#FF4500',
                  color: '#FFF',
                  padding: '0.5rem 1rem',
                  fontSize: '0.9rem',
                }}
              >
                Sign Up
              </Button>
              <Button
                component="a"
                href="/login"
                radius="xl"
                variant="outline"
                style={{
                  borderColor: '#333',
                  color: '#333',
                  padding: '0.5rem 1rem',
                  fontSize: '0.9rem',
                }}
              >
                Login
              </Button>
            </Group>
          </Flex>
        </Container>

        {/* Hero Section */}
        <Container size="md" style={{ marginTop: '4rem' }}>
          <Stack align="center" gap="xl" style={{ padding: '4rem 0' }}>
            <Box maw={600}>
              <Title
                order={1}
                fw={700}
                c="#000"
                ta="center"
                style={{
                  fontSize: '3.5rem',
                  lineHeight: 1.1,
                  fontFamily: 'sans-serif',
                }}
              >
                A social knowledge tool
                <br />
                for researchers
              </Title>
              <Text
                fz="1.125rem"
                c="#222"
                ta="center"
                mt="1rem"
                style={{
                  fontFamily: 'sans-serif',
                  fontWeight: 400,
                }}
              >
                Follow your peers' research trails. Surface and discover new connections. Built on ATProto so you own your data.
              </Text>
            </Box>
          </Stack>
        </Container>

        {/* Features Section */}
        <Container size="xl" style={{ marginTop: '6rem' }}>
          <Flex
            justify="space-between"
            wrap="wrap"
            gap="2rem"
            style={{ marginBottom: '4rem' }}
          >
            {/* Feature 1 */}
            <Box style={{ width: '22%', minWidth: '200px' }}>
              <Stack align="flex-start" gap="0.5rem">
                <Box c="#FF4500" mb="0.5rem">
                  <GridIcon />
                </Box>
                <Text fw={700} fz="1rem" mb="0.25rem" style={{ fontFamily: 'sans-serif' }}>
                  Curate your research trails.
                </Text>
                <Text
                  fz="0.9rem"
                  c="#333"
                  style={{
                    fontFamily: 'sans-serif',
                    lineHeight: 1.4,
                    fontWeight: 400,
                  }}
                >
                  Collect interesting links and add context with reviews and annotations. Organize them into collections others can follow and collaborate on.
                </Text>
              </Stack>
            </Box>

            {/* Feature 2 */}
            <Box style={{ width: '22%', minWidth: '200px' }}>
              <Stack align="flex-start" gap="0.5rem">
                <Box c="#FF4500" mb="0.5rem">
                  <NetworkIcon />
                </Box>
                <Text fw={700} fz="1rem" mb="0.25rem" style={{ fontFamily: 'sans-serif' }}>
                  Follow and grow your network.
                </Text>
                <Text
                  fz="0.9rem"
                  c="#333"
                  style={{
                    fontFamily: 'sans-serif',
                    lineHeight: 1.4,
                    fontWeight: 400,
                  }}
                >
                  See what your peers are sharing and find new collaborators with shared interests. Experience research rabbit holes, together.
                </Text>
              </Stack>
            </Box>

            {/* Feature 3 */}
            <Box style={{ width: '22%', minWidth: '200px' }}>
              <Stack align="flex-start" gap="0.5rem">
                <Box c="#FF4500" mb="0.5rem">
                  <DatabaseIcon />
                </Box>
                <Text fw={700} fz="1rem" mb="0.25rem" style={{ fontFamily: 'sans-serif' }}>
                  Own your data.
                </Text>
                <Text
                  fz="0.9rem"
                  c="#333"
                  style={{
                    fontFamily: 'sans-serif',
                    lineHeight: 1.4,
                    fontWeight: 400,
                  }}
                >
                  Built on ATProto so you own your data. New apps will come to you – no more rebuilding your social graph and data when apps pivot and shut down.
                </Text>
              </Stack>
            </Box>

            {/* Feature 4 */}
            <Box style={{ width: '22%', minWidth: '200px' }}>
              <Stack align="flex-start" gap="0.5rem">
                <Box c="#FF4500" mb="0.5rem">
                  <LinkIcon />
                </Box>
                <Text fw={700} fz="1rem" mb="0.25rem" style={{ fontFamily: 'sans-serif' }}>
                  Discover relevant context and connections.
                </Text>
                <Text
                  fz="0.9rem"
                  c="#333"
                  style={{
                    fontFamily: 'sans-serif',
                    lineHeight: 1.4,
                    fontWeight: 400,
                  }}
                >
                  Easily find and filter for relevant research based on your network. See the big picture and get the extra context that matters before you dive into a long read.
                </Text>
              </Stack>
            </Box>
          </Flex>
        </Container>

        {/* Footer */}
        <Container size="xl">
          <Flex
            justify="space-between"
            align="center"
            style={{
              padding: '2rem',
              borderTop: '1px solid rgba(0,0,0,0.1)',
            }}
          >
            {/* Left side */}
            <Group gap="0.5rem">
              <Text fz="0.875rem" c="#555" style={{ fontFamily: 'sans-serif' }}>
                Made by
              </Text>
              <Group gap="0.25rem">
                <CosmikIcon />
                <Text fz="0.875rem" c="purple" style={{ fontFamily: 'sans-serif' }}>
                  Cosmik
                </Text>
              </Group>
              <Text fz="0.875rem" c="#555" style={{ fontFamily: 'sans-serif' }}>
                with support from Open Philanthropy and Astera
              </Text>
              <Text fz="0.875rem" c="#555" style={{ fontFamily: 'sans-serif' }}>
                ·
              </Text>
              <Text
                component="a"
                href="#"
                fz="0.875rem"
                c="#000"
                style={{
                  fontFamily: 'sans-serif',
                  textDecoration: 'none',
                }}
                styles={{
                  root: {
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  },
                }}
              >
                Privacy Policy
              </Text>
            </Group>

            {/* Right side */}
            <Group gap="0.75rem">
              <Box component="a" href="#" c="#333">
                <FaGithub size={24} />
              </Box>
              <Box component="a" href="#" c="#333">
                <ButterflyIcon />
              </Box>
              <Box component="a" href="#" c="#333">
                <FaDiscord size={24} />
              </Box>
            </Group>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}
