import { createSembleClient } from '@/services/apiClient';
import { cache } from 'react';

export const getProfile = cache(async (didOrHandle: string) => {
  const client = createSembleClient();
  const response = await client.getProfile({
    identifier: didOrHandle,
  });

  return response;
});
