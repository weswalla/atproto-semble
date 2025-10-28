import { createSembleClient } from '@/services/apiClient';
import { cache } from 'react';

export const getProfile = cache(async (didOrHandle: string) => {
  const client = createSembleClient();
  const response = await client.getProfile({
    identifier: didOrHandle,
  });

  return response;
});

export const getMyProfile = cache(async () => {
  const client = createSembleClient();
  const response = await client.getMyProfile();

  return response;
});
