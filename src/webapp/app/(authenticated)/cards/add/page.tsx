'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/services/auth';
import { ApiClient } from '@/api-client/ApiClient';
import {
  Box,
  Stack,
  Text,
  Title,
  Card,
  TextInput,
  Textarea,
  Button,
  Group,
  Checkbox,
  Loader,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import type { GetMyCollectionsResponse } from '@/api-client/types';

export default function AddCardPage() {
  const form = useForm({
    initialValues: {
      url: '',
      note: '',
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [collections, setCollections] = useState<GetMyCollectionsResponse['collections']>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const router = useRouter();

  // Create API client instance
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => getAccessToken(),
  );

  // Load collections on component mount
  useEffect(() => {
    const loadCollections = async () => {
      try {
        const response = await apiClient.getMyCollections({
          limit: 20,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
        });
        setCollections(response.collections);
      } catch (error) {
        console.error('Error loading collections:', error);
      } finally {
        setCollectionsLoading(false);
      }
    };

    loadCollections();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.getValues().url.trim()) {
      setError('URL is required');
      return;
    }

    // Basic URL validation
    try {
      new URL(form.getValues().url);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient.addUrlToLibrary({
        url: form.getValues().url.trim(),
        note: form.getValues().note.trim() || undefined,
        collectionIds: selectedCollectionIds.length > 0 ? selectedCollectionIds : undefined,
      });

      // Redirect to dashboard or cards page on success
      router.push('/library');
    } catch (error: any) {
      console.error('Error adding card:', error);
      setError(error.message || 'Failed to add card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionToggle = (collectionId: string) => {
    setSelectedCollectionIds(prev => 
      prev.includes(collectionId)
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  return (
    <Box>
      <Stack>
        <Stack gap={0}>
          <Title order={1}>Add Card</Title>
          <Text c={'gray'}>
            Add a URL to your library with an optional note.
          </Text>
        </Stack>

        <Card withBorder>
          <Stack>
            <Title order={3}>Add URL to Library</Title>

            <Stack>
              <form onSubmit={handleSubmit}>
                <Stack>
                  <Stack>
                    <TextInput
                      id="url"
                      label="URL"
                      type="url"
                      placeholder="https://example.com"
                      disabled={loading}
                      required
                      key={form.key('url')}
                      {...form.getInputProps('url')}
                    />

                    <Textarea
                      id="note"
                      label="Note"
                      placeholder="Add a note about this URL..."
                      disabled={loading}
                      rows={3}
                      key={form.key('note')}
                      {...form.getInputProps('note')}
                    />

                    {/* Collections Selection */}
                    <Stack gap="xs">
                      <Text fw={500} size="sm">
                        Add to Collections (optional)
                      </Text>
                      {collectionsLoading ? (
                        <Group>
                          <Loader size="xs" />
                          <Text size="sm" c="dimmed">Loading collections...</Text>
                        </Group>
                      ) : collections.length > 0 ? (
                        <Stack gap="xs">
                          {collections.map((collection) => (
                            <Card
                              key={collection.id}
                              withBorder
                              p="sm"
                              style={{
                                cursor: 'pointer',
                                backgroundColor: selectedCollectionIds.includes(collection.id) 
                                  ? 'var(--mantine-color-blue-0)' 
                                  : undefined,
                                borderColor: selectedCollectionIds.includes(collection.id)
                                  ? 'var(--mantine-color-blue-4)'
                                  : undefined,
                              }}
                              onClick={() => handleCollectionToggle(collection.id)}
                            >
                              <Group justify="space-between" align="flex-start">
                                <Stack gap={2} style={{ flex: 1 }}>
                                  <Text fw={500} size="sm">
                                    {collection.name}
                                  </Text>
                                  {collection.description && (
                                    <Text size="xs" c="dimmed">
                                      {collection.description}
                                    </Text>
                                  )}
                                  <Text size="xs" c="dimmed">
                                    {collection.cardCount} cards
                                  </Text>
                                </Stack>
                                <Checkbox
                                  checked={selectedCollectionIds.includes(collection.id)}
                                  onChange={() => handleCollectionToggle(collection.id)}
                                  disabled={loading}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </Group>
                            </Card>
                          ))}
                        </Stack>
                      ) : (
                        <Text size="sm" c="dimmed">
                          No collections found. You can create collections from your library.
                        </Text>
                      )}
                    </Stack>
                  </Stack>

                  {error && <Text c={'red'}>{error}</Text>}

                  <Group>
                    <Button type="submit" loading={loading}>
                      {loading ? 'Adding...' : 'Add Card'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
}
