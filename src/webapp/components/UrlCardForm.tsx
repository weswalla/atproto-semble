'use client';

import { useState, useMemo } from 'react';
import {
  Stack,
  TextInput,
  Textarea,
  Button,
  Group,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { ApiClient } from '@/api-client/ApiClient';
import { UrlMetadataDisplay } from './UrlMetadataDisplay';
import { useUrlMetadata } from '@/hooks/useUrlMetadata';
import { CollectionSelector } from './CollectionSelector';

interface UrlCardFormProps {
  apiClient: ApiClient;
  userId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialUrl?: string;
  showUrlInput?: boolean;
  submitButtonText?: string;
  showCollections?: boolean;
}

export function UrlCardForm({
  apiClient,
  userId,
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

  // URL metadata hook
  const { metadata, existingCard, loading: metadataLoading, error: metadataError } = useUrlMetadata({
    apiClient,
    url: form.getValues().url,
    autoFetch: !!form.getValues().url,
  });

  // Get existing collections for this card (filtered by current user)
  const existingCollections = useMemo(() => {
    if (!existingCard || !userId) return [];
    return existingCard.collections.filter(collection => collection.authorId === userId);
  }, [existingCard, userId]);


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
            <CollectionSelector
              apiClient={apiClient}
              userId={userId}
              selectedCollectionIds={selectedCollectionIds}
              onSelectionChange={setSelectedCollectionIds}
              existingCollections={existingCollections}
              disabled={loading}
              showCreateOption={true}
              placeholder="Search collections..."
            />
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

    </>
  );
}
