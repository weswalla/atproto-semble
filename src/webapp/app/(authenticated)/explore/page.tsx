'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { ApiClient } from '@/api-client/ApiClient';
import { getAccessToken } from '@/services/auth';
import FeedItem from '@/features/feeds/components/feedItem/FeedItem';
import type { GetGlobalFeedResponse } from '@/api-client/types';
import {
  Button,
  Group,
  Loader,
  Stack,
  Title,
  Text,
  Center,
} from '@mantine/core';

export default function ExplorePage() {
  const [feedItems, setFeedItems] = useState<
    GetGlobalFeedResponse['activities']
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize API client instance
  const apiClient = useMemo(
    () =>
      new ApiClient(
        process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
        () => getAccessToken(),
      ),
    [],
  );

  // Fetch initial feed data
  const fetchFeed = useCallback(
    async (reset = false) => {
      try {
        if (reset) {
          setLoading(true);
          setError(null);
        } else {
          setLoadingMore(true);
        }

        const response = await apiClient.getGlobalFeed({
          limit: 20,
          beforeActivityId: reset
            ? undefined
            : feedItems[feedItems.length - 1]?.id,
        });

        if (reset) {
          setFeedItems(response.activities);
        } else {
          setFeedItems((prev) => [...prev, ...response.activities]);
        }

        setHasMore(response.pagination.hasMore);
      } catch (error: any) {
        console.error('Error fetching feed:', error);
        setError(error.message || 'Failed to load feed');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [apiClient, feedItems],
  );

  useEffect(() => {
    fetchFeed(true);
  }, [apiClient]); // Only depend on apiClient, not fetchFeed to avoid infinite loop

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchFeed(false);
    }
  };

  const handleRetry = () => {
    fetchFeed(true);
  };

  if (loading) {
    return (
      <Center h={200}>
        <Loader />
      </Center>
    );
  }

  if (error) {
    return (
      <Center h={200}>
        <Stack align="center">
          <Text c="red">{error}</Text>
          <Button onClick={handleRetry} variant="outline">
            Try Again
          </Button>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack>
      <Title order={2}>Explore</Title>

      {feedItems.length === 0 ? (
        <Center h={200}>
          <Text c="dimmed">No activity to show yet</Text>
        </Center>
      ) : (
        <Stack gap="xl">
          {feedItems.map((item) => (
            <FeedItem key={item.id} item={item} />
          ))}

          {hasMore && (
            <Center>
              <Button
                onClick={handleLoadMore}
                loading={loadingMore}
                variant="outline"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </Button>
            </Center>
          )}
        </Stack>
      )}
    </Stack>
  );
}
