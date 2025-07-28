'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Title,
  TextInput,
  Textarea,
  Button,
  Stack,
  Card,
  Group,
  Alert,
  LoadingOverlay,
} from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useApiClient } from '@/hooks/useApiClient';
import type { GetCollectionPageResponse } from '@/api-client/types';

export default function EditCollectionPage() {
  const router = useRouter();
  const params = useParams();
  const apiClient = useApiClient();
  const collectionId = params.collectionId as string;

  const [collection, setCollection] =
    useState<GetCollectionPageResponse | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load collection data
  useEffect(() => {
    const loadCollection = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getCollectionPage(collectionId);
        setCollection(response);
        setName(response.name);
        setDescription(response.description || '');
      } catch (err) {
        setError('Failed to load collection');
        console.error('Error loading collection:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (collectionId) {
      loadCollection();
    }
  }, [collectionId, apiClient]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Collection name is required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      await apiClient.updateCollection({
        collectionId,
        name: name.trim(),
        description: description.trim() || undefined,
      });

      setSuccess(true);

      // Redirect back to collection page after a brief delay
      setTimeout(() => {
        router.push(`/collections/${collectionId}`);
      }, 1500);
    } catch (err) {
      setError('Failed to update collection');
      console.error('Error updating collection:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/collections/${collectionId}`);
  };

  if (isLoading) {
    return (
      <Container size="md" py="xl">
        <LoadingOverlay visible />
      </Container>
    );
  }

  if (!collection) {
    return (
      <Container size="md" py="xl">
        <Alert icon={<IconAlertCircle size="1rem" />} color="red">
          Collection not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Title order={1}>Edit Collection</Title>

        <Card withBorder p="lg">
          <Stack gap="md">
            {error && (
              <Alert icon={<IconAlertCircle size="1rem" />} color="red">
                {error}
              </Alert>
            )}

            {success && (
              <Alert icon={<IconCheck size="1rem" />} color="green">
                Collection updated successfully! Redirecting...
              </Alert>
            )}

            <TextInput
              label="Collection Name"
              placeholder="Enter collection name"
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
              required
              error={!name.trim() && error ? 'Name is required' : undefined}
            />

            <Textarea
              label="Description"
              placeholder="Enter collection description (optional)"
              value={description}
              onChange={(event) => setDescription(event.currentTarget.value)}
              minRows={3}
              maxRows={6}
            />

            <Group justify="flex-end" mt="md">
              <Button
                variant="subtle"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                loading={isSaving}
                disabled={!name.trim() || success}
              >
                Save Changes
              </Button>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
