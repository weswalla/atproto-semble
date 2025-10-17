import { createApiClient } from '@/services/apiClient';
import { cache } from 'react';

export const getProfile = cache(async (didOrHandle: string) => {
  const client = await createApiClient();
  const response = await client.getProfile({
    identifier: didOrHandle,
  });

  return response;
});
