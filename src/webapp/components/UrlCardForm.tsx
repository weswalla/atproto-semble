'use client';

import { useState } from 'react';
import {
  Stack,
  TextInput,
  Textarea,
  Button,
  Group,
  Text,
  Box,
  Checkbox,
  Loader,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { ApiClient } from '@/api-client/ApiClient';
import { UrlMetadataDisplay } from './UrlMetadataDisplay';
import { useUrlMetadata } from '@/hooks/useUrlMetadata';
import { useCollectionSearch } from '@/hooks/useCollectionSearch';
import { CreateCollectionModal } from './CreateCollectionModal';

interface UrlCardFormProps {
  apiClient: ApiClient;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialUrl?: string;
  showUrlInput?: boolean;
  submitButtonText?: string;
  showCollections?: boolean;
}

export function UrlCardForm({
  apiClient,
  onSuccess,
  onCancel,
  initialUrl = '',
  showUrlInput = true,
  submitButtonText = 'Save Card',
  showCollections = true,
}: UrlCardFormProps) {
  const form = useForm({
    initialValues: {
      url: initialUrl,
      note: '',
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // URL metadata hook
  const { metadata, existingCard, loading: metadataLoading, error: metadataError } = useUrlMetadata({
    apiClient,
    url: form.getValues().url,
    autoFetch: !!form.getValues().url,
  });

  // Collection search hook
  const {
    collections,
    loading: collectionsLoading,
    searchText,
    setSearchText,
    handleSearchKeyPress,
    loadCollections,
  } = useCollectionSearch({ 
    apiClient, 
    initialLoad: showCollections 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = form.getValues().url.trim();
    if (!url) {
      setError('URL is required');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient.addUrlToLibrary({
        url,
        note: form.getValues().note.trim() || undefined,
        collectionIds: selectedCollectionIds.length > 0 ? selectedCollectionIds : undefined,
      });

      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving card:', error);
      setError(error.message || 'Failed to save card. Please try again.');
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

  const handleCreateCollection = () => {
    setCreateModalOpen(true);
  };

  const handleCreateCollectionSuccess = (collectionId: string, collectionName: string) => {
    setSelectedCollectionIds(prev => [...prev, collectionId]);
    loadCollections(searchText.trim() || undefined);
    setCreateModalOpen(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Stack>
          {showUrlInput && (
            <TextInput
              label="URL"
              type="url"
              placeholder="https://example.com"
              disabled={loading}
              required
              key={form.key('url')}
              {...form.getInputProps('url')}
            />
          )}

          {/* URL Metadata Display */}
          {(form.getValues().url || initialUrl) && (
            <UrlMetadataDisplay
              metadata={metadata}
              existingCard={existingCard}
              isLoading={metadataLoading}
              currentUrl={form.getValues().url || initialUrl}
              compact={!showUrlInput}
            />
          )}

          {metadataError && (
            <Text c="red" size="sm">
              {metadataError}
            </Text>
          )}

          <Textarea
            label="Note (optional)"
            placeholder="Add a note about this URL..."
            disabled={loading}
            rows={3}
            key={form.key('note')}
            {...form.getInputProps('note')}
          />

          {/* Collections Selection */}
          {showCollections && (
            <Stack gap="sm">
              <Text fw={500} size="sm">
                Add to Collections (optional)
              </Text>
              
              <TextInput
                placeholder="Search collections..."
                value={searchText}
                onChange={(e) => setSearchText(e.currentTarget.value)}
                onKeyPress={handleSearchKeyPress}
                disabled={loading}
                size="sm"
              />

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
                    {searchText.trim() && (
                      <Box
                        p="sm"
                        style={{
                          cursor: 'pointer',
                          backgroundColor: 'var(--mantine-color-green-0)',
                          borderRadius: '4px',
                          border: '1px solid var(--mantine-color-green-4)',
                          marginBottom: '4px',
                        }}
                        onClick={handleCreateCollection}
                      >
                        <Group justify="space-between" align="center" wrap="nowrap">
                          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                            <Text fw={500} size="sm" c="green.7">
                              Create new collection "{searchText.trim()}"
                            </Text>
                            <Text size="xs" c="green.6">
                              Click to create a new collection with this name
                            </Text>
                          </Stack>
                          <Text size="xs" c="green.6" fw={500}>
                            + New
                          </Text>
                        </Group>
                      </Box>
                    )}
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
                  <Stack gap="sm" py="md">
                    <Text size="sm" c="dimmed" ta="center">
                      No collections found for "{searchText.trim()}"
                    </Text>
                    <Box
                      p="sm"
                      style={{
                        cursor: 'pointer',
                        backgroundColor: 'var(--mantine-color-green-0)',
                        borderRadius: '4px',
                        border: '1px solid var(--mantine-color-green-4)',
                      }}
                      onClick={handleCreateCollection}
                    >
                      <Group justify="space-between" align="center" wrap="nowrap">
                        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                          <Text fw={500} size="sm" c="green.7">
                            Create new collection "{searchText.trim()}"
                          </Text>
                          <Text size="xs" c="green.6">
                            Click to create a new collection with this name
                          </Text>
                        </Stack>
                        <Text size="xs" c="green.6" fw={500}>
                          + New
                        </Text>
                      </Group>
                    </Box>
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed" py="md" ta="center">
                    No collections found. You can create collections from your library.
                  </Text>
                )}
              </Box>
            </Stack>
          )}

          {error && <Text c="red">{error}</Text>}

          <Group>
            <Button type="submit" loading={loading}>
              {loading ? 'Saving...' : submitButtonText}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </Group>
        </Stack>
      </form>

      <CreateCollectionModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateCollectionSuccess}
        apiClient={apiClient}
        initialName={searchText.trim()}
      />
    </>
  );
}
