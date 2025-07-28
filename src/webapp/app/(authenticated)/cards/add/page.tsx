'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAccessToken } from '@/services/auth';
import { ApiClient } from '@/api-client/ApiClient';
import {
  Box,
  Stack,
  Text,
  Title,
  Card,
} from '@mantine/core';
import { UrlCardForm } from '@/components/UrlCardForm';
import { useAuth } from '@/hooks/useAuth';

export default function AddCardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const preSelectedCollectionId = searchParams.get('collectionId');

  // Create API client instance - memoized to avoid recreating on every render
  const apiClient = useMemo(
    () => new ApiClient(
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
      () => getAccessToken(),
    ),
    []
  );

  const handleSuccess = () => {
    router.push('/library');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <Box maw={600} mx="auto" p="md">
      <Stack>
        <Stack gap={0}>
          <Title order={1}>Add Card</Title>
          <Text c="gray">
            Add a URL to your library with an optional note.
          </Text>
        </Stack>

        <Card withBorder>
          <Stack>
            <Title order={3}>Add URL to Library</Title>
            <UrlCardForm
              apiClient={apiClient}
              userId={user?.id}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              submitButtonText="Add Card"
              showCollections={true}
              preSelectedCollectionId={preSelectedCollectionId}
            />
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
}
