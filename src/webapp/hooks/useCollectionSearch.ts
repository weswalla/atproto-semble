import { useState, useEffect, useCallback, useMemo } from 'react';
import { ApiClient } from '@/api-client/ApiClient';
import type { GetMyCollectionsResponse } from '@/api-client/types';

interface UseCollectionSearchProps {
  apiClient: ApiClient;
  initialLoad?: boolean;
}

export function useCollectionSearch({ apiClient, initialLoad = true }: UseCollectionSearchProps) {
  const [collections, setCollections] = useState<GetMyCollectionsResponse['collections']>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);

  // Memoized search parameters to avoid unnecessary API calls
  const searchParams = useMemo(() => ({
    limit: 20,
    sortBy: 'updatedAt' as const,
    sortOrder: 'desc' as const,
  }), []);

  // Memoized load function that only changes when apiClient changes
  const loadCollections = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const response = await apiClient.getMyCollections({
        ...searchParams,
        searchText: search || undefined,
      });
      setCollections(response.collections);
    } catch (error) {
      console.error('Error loading collections:', error);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, [apiClient, searchParams]);

  // Initial load effect - only runs once when component mounts
  useEffect(() => {
    if (initialLoad && !hasInitialized) {
      loadCollections();
      setHasInitialized(true);
    }
  }, [initialLoad, hasInitialized, loadCollections]);

  // Search function that only triggers when explicitly called
  const handleSearch = useCallback(() => {
    const trimmedSearch = searchText.trim();
    loadCollections(trimmedSearch || undefined);
  }, [searchText, loadCollections]);

  // Handle search input changes
  const handleSearchTextChange = useCallback((value: string) => {
    setSearchText(value);
  }, []);

  // Handle search on Enter key press
  const handleSearchKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  return {
    collections,
    loading,
    searchText,
    setSearchText: handleSearchTextChange,
    handleSearch,
    handleSearchKeyPress,
    loadCollections,
  };
}
