'use client';

import {
  AspectRatio,
  Box,
  Image,
  Paper,
  Stack,
  Text,
  Title,
  Loader,
  Group,
} from '@mantine/core';

import type { UrlCardView } from '@/api-client/types';

export interface UrlMetadata {
  url: string;
  title?: string;
  description?: string;
  author?: string;
  siteName?: string;
  imageUrl?: string;
  type?: string;
}

interface UrlMetadataDisplayProps {
  metadata: UrlMetadata | null;
  existingCard?: UrlCardView | null;
  isLoading: boolean;
  currentUrl: string;
  compact?: boolean;
}

export function UrlMetadataDisplay({
  metadata,
  existingCard,
  isLoading,
  currentUrl,
  compact = false,
}: UrlMetadataDisplayProps) {
  if (isLoading) {
    return (
      <Stack gap={0} align="center" py="md">
        <Loader type="dots" size="sm" />
        <Text fz="sm" fw={500} c="gray">
          Loading page information...
        </Text>
      </Stack>
    );
  }

  if (!metadata) {
    return (
      <Stack gap={0}>
        <Text fz="sm" c="gray">
          Current page:
        </Text>
        <Text fz="sm" truncate="end">
          {currentUrl || 'Loading...'}
        </Text>
      </Stack>
    );
  }

  return (
    <Paper bg="gray.2" p="sm">
      <Stack gap={compact ? 'xs' : 'sm'}>
        {metadata.imageUrl && (
          <AspectRatio ratio={2 / 1}>
            <Image
              src={metadata.imageUrl}
              alt={metadata.title || 'Page preview'}
            />
          </AspectRatio>
        )}
        <Stack gap="xs">
          <Stack gap={0}>
            <Title 
              order={compact ? 4 : 3} 
              lineClamp={2} 
              fz={compact ? 'sm' : 'md'} 
              fw={500}
            >
              {metadata.title || 'Untitled'}
            </Title>
            {metadata.description && (
              <Text fz="sm" fw={500} c="gray" lineClamp={2}>
                {metadata.description}
              </Text>
            )}
          </Stack>
          <Group justify="space-between" align="center">
            <Text fz="xs" c="gray">
              {metadata.siteName || new URL(currentUrl).hostname}
            </Text>
            {existingCard && (
              <Text fz="xs" c="blue" fw={500}>
                Already in library
              </Text>
            )}
          </Group>
          
          {existingCard && existingCard.collections.length > 0 && (
            <Group gap="xs" mt="xs">
              <Text fz="xs" c="gray">
                Collections:
              </Text>
              {existingCard.collections.map((collection, index) => (
                <Text key={collection.id} fz="xs" c="blue">
                  {collection.name}
                  {index < existingCard.collections.length - 1 && ','}
                </Text>
              ))}
            </Group>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
