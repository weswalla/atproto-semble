'use client';

import { useState, useMemo } from 'react';
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
import { useCollectionSearch } from '@/hooks/useCollectionSearch';

export default function AddCardPage() {
  const form = useForm({
    initialValues: {
      url: '',
      note: '',
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const router = useRouter();

  // Create API client instance - memoized to avoid recreating on every render
  const apiClient = useMemo(
    () => new ApiClient(
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
      () => getAccessToken(),
    ),
    []
  );

  // Use the collection search hook
  const {
    collections,
    loading: collectionsLoading,
    searchText,
    setSearchText,
    handleSearch,
    handleSearchKeyPress,
  } = useCollectionSearch({ apiClient });

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
    <Box maw={600} mx="auto" p="md">
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
                    <Stack gap="sm">
                      <Text fw={500} size="sm">
                        Add to Collections (optional)
                      </Text>
                      
                      {/* Search Collections */}
                      <TextInput
                        placeholder="Search collections..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.currentTarget.value)}
                        onKeyPress={handleSearchKeyPress}
                        disabled={loading}
                        size="sm"
                      />

                      {/* Search Results */}
                      <Box>
                        {collectionsLoading ? (
                          <Group gap="xs" py="md">
                            <Loader size="xs" />
                            <Text size="sm" c="dimmed">Searching collections...</Text>
                          </Group>
                        ) : collections.length > 0 ? (
                          <Stack gap={0}>
                            <Text size="xs" c="dimmed" mb="xs">
                              {collections.length} collection{collections.length !== 1 ? 's' : ''} found
                            </Text>
                            {collections.map((collection, index) => (
                              <Box
                                key={collection.id}
                                p="sm"
                                style={{
                                  cursor: 'pointer',
                                  backgroundColor: selectedCollectionIds.includes(collection.id) 
                                    ? 'var(--mantine-color-blue-0)' 
                                    : index % 2 === 0 
                                      ? 'var(--mantine-color-gray-0)' 
                                      : 'transparent',
                                  borderRadius: '4px',
                                  border: selectedCollectionIds.includes(collection.id)
                                    ? '1px solid var(--mantine-color-blue-4)'
                                    : '1px solid transparent',
                                }}
                                onClick={() => handleCollectionToggle(collection.id)}
                              >
                                <Group justify="space-between" align="center" wrap="nowrap">
                                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                                    <Group gap="xs" align="center">
                                      <Text fw={500} size="sm" truncate>
                                        {collection.name}
                                      </Text>
                                      <Text size="xs" c="dimmed">
                                        {collection.cardCount} cards
                                      </Text>
                                    </Group>
                                    {collection.description && (
                                      <Text size="xs" c="dimmed" lineClamp={1}>
                                        {collection.description}
                                      </Text>
                                    )}
                                  </Stack>
                                  <Checkbox
                                    checked={selectedCollectionIds.includes(collection.id)}
                                    onChange={() => handleCollectionToggle(collection.id)}
                                    disabled={loading}
                                    onClick={(e) => e.stopPropagation()}
                                    size="sm"
                                  />
                                </Group>
                              </Box>
                            ))}
                          </Stack>
                        ) : searchText.trim() ? (
                          <Text size="sm" c="dimmed" py="md" ta="center">
                            No collections found for "{searchText.trim()}"
                          </Text>
                        ) : (
                          <Text size="sm" c="dimmed" py="md" ta="center">
                            No collections found. You can create collections from your library.
                          </Text>
                        )}
                      </Box>
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
