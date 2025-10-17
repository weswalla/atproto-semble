import { createApiClient } from '@/services/apiClient';
import { cache } from 'react';

interface PageParams {
  page?: number;
  limit?: number;
}

export const getLibrariesForUrl = cache(
  async (url: string, params?: PageParams) => {
    const client = await createApiClient();
    const response = await client.getLibrariesForUrl({
      url,
      page: params?.page,
      limit: params?.limit,
    });

    return response;
  },
);
