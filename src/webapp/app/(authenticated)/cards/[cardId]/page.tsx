'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClientTokenManager } from '@/services/auth';
import { ApiClient } from '@/api-client/ApiClient';
import type { GetUrlCardViewResponse } from '@/api-client/types';
import {
  Button,
  Loader,
  Stack,
  Text,
  Card,
  Title,
  Anchor,
  Blockquote,
  Box,
  Group,
  Badge,
  Image,
  Divider,
} from '@mantine/core';

export default function CardPage() {
  const [card, setCard] = useState<GetUrlCardViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useParams();
  const cardId = params.cardId as string;

  useEffect(() => {
    // Create API client instance
    const apiClient = new ApiClient(
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
      createClientTokenManager(),
    );

    const fetchCard = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getUrlCardView(cardId);
        setCard(response);
      } catch (error: any) {
        console.error('Error fetching card:', error);
        setError(error.message || 'Failed to load card');
      } finally {
        setLoading(false);
      }
    };

    if (cardId) {
      fetchCard();
    }
  }, [cardId]);

  if (loading) {
    return <Loader />;
  }

  if (error || !card) {
    return (
      <Stack align="center">
        <Text c={'red'}>{error || 'Card not found'}</Text>
        <Button onClick={() => router.back()}>Go Back</Button>
      </Stack>
    );
  }

  return (
    <Box>
      <Stack>
        <Group>
          <Button variant="outline" onClick={() => router.back()}>
            ← Back
          </Button>
        </Group>

        <Card withBorder>
          <Stack>
            <Stack>
              <Group wrap="nowrap">
                <Stack>
                  <Text fz={'xl'} fw={600}>
                    {card.cardContent.title || 'Untitled'}
                  </Text>
                  <Group gap={'xs'}>
                    <Badge variant="outline">{card.type}</Badge>
                    <Text fz={'sm'} c={'gray'}>
                      Added {new Date(card.createdAt).toLocaleDateString()}
                    </Text>
                  </Group>
                </Stack>
                {card.cardContent.thumbnailUrl && (
                  <Image
                    src={card.cardContent.thumbnailUrl}
                    alt={card.cardContent.title || 'Card thumbnail'}
                    w={128}
                    radius={'md'}
                  />
                )}
              </Group>
            </Stack>
            <Stack gap={'xl'}>
              {/* URL */}
              <Stack gap={'xs'}>
                <Title order={3} fz={'sm'}>
                  URL
                </Title>
                <Anchor
                  c="blue"
                  href={card.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {card.url}
                </Anchor>
              </Stack>

              {/* Description */}
              {card.cardContent.description && (
                <Stack gap={'xs'}>
                  <Title order={3} fz={'sm'}>
                    Description
                  </Title>
                  <Text c={'gray'}>{card.cardContent.description}</Text>
                </Stack>
              )}

              {/* Author */}
              {card.cardContent.author && (
                <Stack gap={'xs'}>
                  <Title order={3} fz={'sm'}>
                    Author
                  </Title>
                  <Text c={'gray'}>{card.cardContent.author}</Text>
                </Stack>
              )}

              {/* Note */}
              {card.note && (
                <Stack gap={'xs'}>
                  <Title order={3} fz={'sm'}>
                    Note
                  </Title>
                  <Blockquote color="yellow" p={'xs'} fz={'sm'}>
                    {card.note.text}
                  </Blockquote>
                </Stack>
              )}

              {/* Collections */}
              {card.collections && card.collections.length > 0 && (
                <Stack gap={'xs'}>
                  <Title order={3} fz={'sm'}>
                    Collections
                  </Title>
                  <Group>
                    {card.collections.map((collection) => (
                      <Badge
                        key={collection.id}
                        variant="outline"
                        onClick={() =>
                          router.push(`/collections/${collection.id}`)
                        }
                      >
                        {collection.name}
                      </Badge>
                    ))}
                  </Group>
                </Stack>
              )}

              {/* Metadata */}
              <Divider />

              <Group justify="space-between">
                <Text fz={'sm'} fw={500} c={'gray'}>
                  Created: {new Date(card.createdAt).toLocaleString()}
                </Text>
                <Text fz={'sm'} fw={500} c={'gray'}>
                  Updated: {new Date(card.updatedAt).toLocaleString()}
                </Text>
              </Group>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
}
