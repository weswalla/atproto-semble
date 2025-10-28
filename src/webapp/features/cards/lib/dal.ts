import { createSembleClient } from '@/services/apiClient';
import { cache } from 'react';

export const getUrlMetadata = cache(async (url: string) => {
  const client = createSembleClient();
  const response = await client.getUrlMetadata(url);

  return response;
});

export const getCardFromMyLibrary = cache(async (url: string) => {
  const client = createSembleClient();
  const response = await client.getUrlStatusForMyLibrary({ url: url });

  return response;
});
