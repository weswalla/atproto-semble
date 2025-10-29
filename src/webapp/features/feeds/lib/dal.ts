import { createSembleClient } from '@/services/apiClient';
import { cache } from 'react';

interface PageParams {
  page?: number;
  limit?: number;
}

export const getGlobalFeed = cache(async (params?: PageParams) => {
  const client = createSembleClient();
  const response = await client.getGlobalFeed({
    page: params?.page,
    limit: params?.limit,
  });

  return response;
});
