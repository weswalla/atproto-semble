import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ApiClient } from '@/api-client/ApiClient';
import type { GetMyCollectionsResponse } from '@/api-client/types';

interface UseCollectionSearchProps {
  apiClient: ApiClient;
  initialLoad?: boolean;
  debounceMs?: number;
}

export function useCollectionSearch({
  apiClient,
  initialLoad = true,
  debounceMs = 300,
}: UseCollectionSearchProps) {
  const [collections, setCollections] = useState<
    GetMyCollectionsResponse['collections']
  >([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized search parameters to avoid unnecessary API calls
  const searchParams = useMemo(
    () => ({
      limit: 20,
      sortBy: 'updatedAt' as const,
      sortOrder: 'desc' as const,
    }),
    [],
  );

  // Memoized load function that only changes when apiClient changes
  const loadCollections = useCallback(
    async (search?: string) => {
      setLoading(true);
      try {
        const response = await apiClient.getMyCollections({
          ...searchParams,
          searchText: search || undefined,
        });
        setCollections(response.collections);
      } catch (error) {
        console.error('Error loading collections:', error);
        // Don't clear collections on error, keep showing previous results
      } finally {
        setLoading(false);
      }
    },
    [apiClient, searchParams],
  );

  // Initial load effect - only runs once when component mounts
  useEffect(() => {
    if (initialLoad && !hasInitialized) {
      loadCollections();
      setHasInitialized(true);
    }
  }, [initialLoad, hasInitialized, loadCollections]);

  // Debounced search effect - triggers when searchText changes
  useEffect(() => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Only set up debounced search if we've initialized
    if (hasInitialized) {
      debounceTimeoutRef.current = setTimeout(() => {
        const trimmedSearch = searchText.trim();
        loadCollections(trimmedSearch || undefined);
      }, debounceMs);
    }

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchText, loadCollections, hasInitialized, debounceMs]);

  // Manual search function (kept for backward compatibility)
  const handleSearch = useCallback(() => {
    // Clear any pending debounced search
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const trimmedSearch = searchText.trim();
    loadCollections(trimmedSearch || undefined);
  }, [searchText, loadCollections]);

  // Handle search input changes
  const handleSearchTextChange = useCallback((value: string) => {
    setSearchText(value);
  }, []);

  // Handle search on Enter key press (immediate search, no debounce)
  const handleSearchKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch],
  );

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
