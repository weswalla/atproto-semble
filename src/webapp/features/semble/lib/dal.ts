import { createSembleClient } from '@/services/apiClient';
import { cache } from 'react';

interface PageParams {
  page?: number;
  limit?: number;
}

export const getLibrariesForUrl = cache(
  async (url: string, params?: PageParams) => {
    const client = createSembleClient();
    const response = await client.getLibrariesForUrl({
      url,
      page: params?.page,
      limit: params?.limit,
    });

    return response;
  },
);
import { apiClient } from '@/api-client';
import type { 
  GetLibrariesForUrlParams,
  GetSimilarUrlsForUrlParams 
} from '@semble/types';

export const getLibrariesForUrl = (
  url: string,
  params: Omit<GetLibrariesForUrlParams, 'url'>
) => {
  return apiClient.getLibrariesForUrl({ url, ...params });
};

export const getSimilarUrlsForUrl = (
  url: string,
  params: Omit<GetSimilarUrlsForUrlParams, 'url'>
) => {
  return apiClient.getSimilarUrlsForUrl({ url, ...params });
};
