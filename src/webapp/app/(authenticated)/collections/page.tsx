'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/services/auth';
import { ApiClient } from '@/api-client/ApiClient';
import type { GetMyCollectionsResponse } from '@/api-client/types';
import {
  Box,
  Button,
  Card,
  Container,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<
    GetMyCollectionsResponse['collections']
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  // Create API client instance
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => getAccessToken(),
  );

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getMyCollections({ limit: 50 });
        setCollections(response.collections);
      } catch (error: any) {
        console.error('Error fetching collections:', error);
        setError(error.message || 'Failed to load collections');
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <Box>
      <Stack>
        <Group justify="space-between">
          <Stack gap={0}>
            <Title order={1}>Collections</Title>
            <Text c={'gray'}>Organize your cards into collections</Text>
          </Stack>
          <Button onClick={() => router.push('/collections/create')}>
            Create Collection
          </Button>
        </Group>

        {error && <Text c="red">{error}</Text>}

        {collections.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={'md'}>
            {collections.map((collection) => (
              <Card
                key={collection.id}
                component="button"
                withBorder
                onClick={() => router.push(`/collections/${collection.id}`)}
              >
                <Stack>
                  <Stack align="start">
                    <Text fw={600} lineClamp={1}>
                      {collection.name}
                    </Text>

                    {collection.description && (
                      <Text lineClamp={2}>{collection.description}</Text>
                    )}
                  </Stack>
                  <Stack>
                    <Group justify="space-between">
                      <Text c={'gray'}>{collection.cardCount} cards</Text>
                      <Text c={'gray'}>
                        Created{' '}
                        {new Date(collection.createdAt).toLocaleDateString()}
                      </Text>
                    </Group>
                  </Stack>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <Stack align="center">
            <Text>No collections yet</Text>
            <Button onClick={() => router.push('/collections/create')}>
              Create Your First Collection
            </Button>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
