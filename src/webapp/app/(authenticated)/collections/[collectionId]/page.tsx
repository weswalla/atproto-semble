'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getAccessToken } from '@/services/auth';
import { ApiClient } from '@/api-client/ApiClient';
import { UrlCard } from '@/components/UrlCard';
import type { GetCollectionPageResponse } from '@/api-client/types';
import {
  Button,
  Group,
  Loader,
  Stack,
  Text,
  Card,
  Title,
  Box,
  SimpleGrid,
} from '@mantine/core';

export default function CollectionPage() {
  const [collection, setCollection] =
    useState<GetCollectionPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useParams();
  const collectionId = params.collectionId as string;

  // Create API client instance
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => getAccessToken(),
  );

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getCollectionPage(collectionId, {
          limit: 50,
        });
        setCollection(response);
      } catch (error: any) {
        console.error('Error fetching collection:', error);
        setError(error.message || 'Failed to load collection');
      } finally {
        setLoading(false);
      }
    };

    if (collectionId) {
      fetchCollection();
    }
  }, [collectionId]);

  if (loading) {
    return <Loader />;
  }

  if (error || !collection) {
    return (
      <Stack align="center">
        <Text c={'red'}>{error || 'Collection not found'}</Text>
        <Button onClick={() => router.back()}>Go Back</Button>
      </Stack>
    );
  }

  return (
    <Box>
      <Stack>
        <Group justify="space-between">
          <Button variant="outline" onClick={() => router.back()}>
            ← Back
          </Button>
          <Group>
            <Button
              variant="outline"
              onClick={() => router.push(`/collections/${collectionId}/edit`)}
            >
              Edit Collection
            </Button>
            <Button
              onClick={() =>
                router.push(`/cards/add?collectionId=${collectionId}`)
              }
            >
              Add Card
            </Button>
          </Group>
        </Group>

        {/* Collection Header */}
        <Card withBorder>
          <Stack>
            <Text fw={600} lineClamp={1}>
              {collection.name}
            </Text>
            {collection.description && (
              <Text lineClamp={2}>{collection.description}</Text>
            )}
          </Stack>

          <Group>
            <Text fz={'sm'} c={'gray'}>
              {collection.urlCards.length} cards
            </Text>
            <Text fz={'sm'} c={'gray'}>
              By {collection.author.name} (@{collection.author.handle})
            </Text>
          </Group>
        </Card>

        {/* Cards Section */}
        <Stack>
          <Group justify="space-between">
            <Title order={2}>Cards</Title>
            {collection.pagination && collection.pagination.totalCount > 0 && (
              <Text fz={'sm'} c={'gray'}>
                Showing {collection.urlCards.length} of{' '}
                {collection.pagination.totalCount} cards
              </Text>
            )}
          </Group>

          {collection.urlCards.length > 0 ? (
            <Box>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={'md'}>
                {collection.urlCards.map((card) => (
                  <UrlCard
                    key={card.id}
                    cardId={card.id}
                    url={card.url}
                    title={card.cardContent.title}
                    description={card.cardContent.description}
                    author={card.cardContent.author}
                    imageUrl={card.cardContent.thumbnailUrl}
                    addedAt={card.createdAt}
                    note={card.note?.text}
                  />
                ))}
              </SimpleGrid>

              {/* Pagination */}
              {collection.pagination && collection.pagination.hasMore && (
                <Stack align="center">
                  <Button variant="outline">Load More Cards</Button>
                </Stack>
              )}
            </Box>
          ) : (
            <Stack align="center">
              <Text c={'gray'}>No cards in this collection yet</Text>
              <Button
                onClick={() =>
                  router.push(`/cards/add?collectionId=${collectionId}`)
                }
              >
                Add Your First Card
              </Button>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
