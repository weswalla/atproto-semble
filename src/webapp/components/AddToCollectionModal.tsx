'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ApiClient } from '@/api-client/ApiClient';
import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { CollectionSelector } from './CollectionSelector';
import { getUrlCardView } from '@/features/cards/lib/dal';

interface Collection {
  id: string;
  name: string;
  description?: string;
  cardCount: number;
  authorId: string;
}

interface AddToCollectionModalProps {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddToCollectionModal({
  cardId,
  isOpen,
  onClose,
  onSuccess,
}: AddToCollectionModalProps) {
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
    [],
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Create API client instance
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000',
  );

  // Get existing collections for this card
  const existingCollections = useMemo(() => {
    if (!card) return [];
    return card.collections || [];
  }, [card]);

  const fetchCard = useCallback(async () => {
    // Create API client instance
    const apiClient = new ApiClient(
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000',
    );

    try {
      setLoading(true);
      setError('');
      const response = await getUrlCardView(cardId);
      setCard(response);
    } catch (error: any) {
      console.error('Error fetching card:', error);
      setError(error.message || 'Failed to load card details');
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    if (isOpen) {
      fetchCard();
    }
  }, [isOpen, cardId, fetchCard]);

  const handleSubmit = async () => {
    if (selectedCollectionIds.length === 0) {
      setError('Please select at least one collection');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Create API client instance
      const apiClient = new ApiClient(
        process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000',
      );

      // Add card to all selected collections in a single request
      await apiClient.addCardToCollection({
        cardId,
        collectionIds: selectedCollectionIds,
      });

      // Success
      onSuccess?.();
      onClose();
      setSelectedCollectionIds([]);
    } catch (error: any) {
      console.error('Error adding card to collections:', error);
      setError(error.message || 'Failed to add card to collections');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
      setSelectedCollectionIds([]);
      setError('');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      opened={isOpen}
      onClose={handleClose}
      title="Add to Collections"
      centered
      size="md"
    >
      <Stack p="sm">
        {loading ? (
          <Text size="sm" c="dimmed" ta="center" py="md">
            Loading card details...
          </Text>
        ) : error ? (
          <Stack align="center">
            <Text c="red">{error}</Text>
            <Button onClick={fetchCard} variant="outline" size="sm">
              Try Again
            </Button>
          </Stack>
        ) : (
          <>
            <CollectionSelector
              apiClient={apiClient}
              selectedCollectionIds={selectedCollectionIds}
              onSelectionChange={setSelectedCollectionIds}
              existingCollections={existingCollections}
              disabled={submitting}
              showCreateOption={true}
              placeholder="Search collections to add..."
            />

            {error && (
              <Text c="red" size="sm">
                {error}
              </Text>
            )}

            <Group gap={'xs'} grow>
              <Button
                onClick={handleSubmit}
                disabled={submitting || selectedCollectionIds.length === 0}
                loading={submitting}
              >
                {submitting
                  ? 'Adding...'
                  : `Add to ${selectedCollectionIds.length} Collection${selectedCollectionIds.length !== 1 && 's'}`}
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={submitting}
              >
                Cancel
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}
