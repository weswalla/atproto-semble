'use client';

import {
  Container,
  Title,
  Text,
  Stack,
  Button,
  Code,
  Alert,
  Box,
  Group,
} from '@mantine/core';
import { useState } from 'react';
import { BiInfoCircle } from 'react-icons/bi';

export default function BookmarkletPage() {
  const [copied, setCopied] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const bookmarkletCode = `javascript:(function(){
    const currentUrl = window.location.href;
    const sembleUrl = '${appUrl}/url?id=' + currentUrl;
    window.open(sembleUrl, '_blank');
  })();`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookmarkletCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy bookmarklet:', err);
    }
  };

  // Create the bookmarklet link using dangerouslySetInnerHTML to bypass React's security check
  const createBookmarkletLink = () => {
    return {
      __html: `<a href="${bookmarkletCode}" style="text-decoration: none; padding: 8px 16px; background-color: var(--mantine-color-blue-6); color: white; border-radius: 4px; display: inline-flex; align-items: center; gap: 8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/></svg>Open in Semble</a>`
    };
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Stack gap="md">
          <Title order={1}>Semble Bookmarklet</Title>
          <Text size="lg" c="dimmed">
            Add this bookmarklet to your browser to quickly open any webpage in Semble
            and see what your network has shared about it.
          </Text>
        </Stack>

        <Alert icon={<BiInfoCircle />} title="How to install" color="blue">
          <Stack gap="sm">
            <Text>
              1. Copy the bookmarklet code below or drag the button to your bookmarks bar
            </Text>
            <Text>
              2. When you're on any webpage, click the bookmarklet to open it in Semble
            </Text>
            <Text>
              3. You'll see who in your network has shared that URL and any notes they've added
            </Text>
          </Stack>
        </Alert>

        <Stack gap="md">
          <Title order={2} size="h3">
            Method 1: Drag to Bookmarks Bar
          </Title>
          <Text c="dimmed">
            Drag this button directly to your browser's bookmarks bar:
          </Text>
          <Group>
            <Box dangerouslySetInnerHTML={createBookmarkletLink()} />
          </Group>
        </Stack>

        <Stack gap="md">
          <Title order={2} size="h3">
            Method 2: Copy Code
          </Title>
          <Text c="dimmed">
            Copy this code and create a new bookmark with it as the URL:
          </Text>
          <Box pos="relative">
            <Code
              block
              p="md"
              style={{
                wordBreak: 'break-all',
                whiteSpace: 'pre-wrap',
                fontSize: '12px',
              }}
            >
              {bookmarkletCode}
            </Code>
            <Button
              size="xs"
              variant="light"
              onClick={handleCopy}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </Box>
        </Stack>

        <Alert icon={<BiInfoCircle />} title="Note" color="gray">
          <Text>
            This bookmarklet will open Semble in a new tab. Make sure you're logged in
            to see personalized results from your network.
          </Text>
        </Alert>
      </Stack>
    </Container>
  );
}
