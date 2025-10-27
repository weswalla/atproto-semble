import { createSembleClient } from '@/services/apiClient';
import { cache } from 'react';

interface PageParams {
  page?: number;
  limit?: number;
}

export const getCollectionsForUrl = cache(
  async (url: string, params?: PageParams) => {
    const client = createSembleClient();
    const response = await client.getCollectionsForUrl({
      url,
      page: params?.page,
      limit: params?.limit,
    });

    return response;
  },
);

export const getMyCollections = cache(async (params?: PageParams) => {
  const client = createSembleClient();
  const response = await client.getMyCollections({
    page: params?.page,
    limit: params?.limit,
  });

  return response;
});
