'use client';

import { Title, Text, Stack, Button, Center, Box, Container } from '@mantine/core';
import { FaBluesky } from 'react-icons/fa6';

export default function LandingPage() {
  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorative elements */}
      <Box
        style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          filter: 'blur(40px)',
        }}
      />
      <Box
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          filter: 'blur(30px)',
        }}
      />

      <Container size="md" h="100vh">
        <Center h="100%">
          <Stack align="center" gap="xl">
            {/* Main content */}
            <Stack align="center" gap="md">
              <Title 
                order={1} 
                size="3.5rem"
                fw={700}
                c="white"
                ta="center"
                style={{
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  letterSpacing: '-0.02em',
                }}
              >
                Welcome to Semble
              </Title>
              <Text 
                fw={500} 
                fz="xl" 
                c="rgba(255, 255, 255, 0.9)"
                ta="center"
                maw={600}
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  lineHeight: 1.4,
                }}
              >
                A social knowledge tool for researchers
              </Text>
            </Stack>

            {/* CTA Button */}
            <Button 
              component="a" 
              href="/login" 
              leftSection={<FaBluesky />}
              size="lg"
              radius="xl"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 600,
                padding: '12px 32px',
                transition: 'all 0.3s ease',
              }}
              styles={{
                root: {
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.25)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  },
                },
              }}
            >
              Sign in with Bluesky
            </Button>

            {/* Subtle feature hints */}
            <Stack align="center" gap="xs" mt="xl">
              <Text 
                fz="sm" 
                c="rgba(255, 255, 255, 0.7)"
                ta="center"
              >
                Organize • Share • Discover
              </Text>
            </Stack>
          </Stack>
        </Center>
      </Container>
    </Box>
  );
}
