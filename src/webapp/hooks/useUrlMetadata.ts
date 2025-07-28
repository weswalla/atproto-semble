import { useState, useEffect, useCallback } from 'react';
import { ApiClient } from '@/api-client/ApiClient';
import type { UrlMetadata } from '@/components/UrlMetadataDisplay';
import type { UrlCardView } from '@/api-client/types';

interface UseUrlMetadataProps {
  apiClient: ApiClient;
  url?: string;
  autoFetch?: boolean;
}

export function useUrlMetadata({ apiClient, url, autoFetch = true }: UseUrlMetadataProps) {
  const [metadata, setMetadata] = useState<UrlMetadata | null>(null);
  const [existingCard, setExistingCard] = useState<UrlCardView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(async (targetUrl: string) => {
    if (!targetUrl.trim()) return;

    // Basic URL validation
    try {
      new URL(targetUrl);
    } catch {
      setError('Invalid URL format');
      return;
    }

    setLoading(true);
    setError(null);
    setExistingCard(null);

    try {
      const response = await apiClient.getUrlMetadata(targetUrl);
      setMetadata(response.metadata);

      // If there's an existing card, fetch its details including collections
      if (response.existingCardId) {
        try {
          const cardResponse = await apiClient.getUrlCardView(response.existingCardId);
          setExistingCard(cardResponse);
        } catch (cardErr: any) {
          console.error('Failed to fetch existing card details:', cardErr);
          // Don't set error here as the metadata fetch was successful
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch URL metadata:', err);
      setError('Failed to load page information');
      setMetadata(null);
      setExistingCard(null);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  // Auto-fetch when URL changes
  useEffect(() => {
    if (autoFetch && url) {
      fetchMetadata(url);
    }
  }, [url, autoFetch, fetchMetadata]);

  const refetch = useCallback(() => {
    if (url) {
      fetchMetadata(url);
    }
  }, [url, fetchMetadata]);

  return {
    metadata,
    existingCard,
    loading,
    error,
    fetchMetadata,
    refetch,
  };
}
