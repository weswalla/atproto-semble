import { useState, useCallback } from 'react';
import { ApiClient } from '@/api-client/ApiClient';
import { getAccessToken } from '@/services/auth';
import type { GetMyCollectionsResponse } from '@/api-client/types';

export interface UseCollectionSearchResult {
  collections: GetMyCollectionsResponse['collections'];
  loading: boolean;
  error: string | null;
  searchCollections: (searchText?: string) => Promise<void>;
}

export function useCollectionSearch(): UseCollectionSearchResult {
  const [collections, setCollections] = useState<GetMyCollectionsResponse['collections']>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create API client instance
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => getAccessToken(),
  );

  const searchCollections = useCallback(async (searchText?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getMyCollections({
        limit: 20,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        searchText: searchText || undefined,
      });
      setCollections(response.collections);
    } catch (err) {
      console.error('Error loading collections:', err);
      setError('Failed to load collections');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  return {
    collections,
    loading,
    error,
    searchCollections,
  };
}
