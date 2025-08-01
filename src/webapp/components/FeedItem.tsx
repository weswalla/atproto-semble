'use client';

import { useRouter } from 'next/navigation';
import { UrlCard } from './UrlCard';
import type { FeedItem as FeedItemType } from '@/api-client/types';
import {
  Stack,
  Text,
  Group,
  Anchor,
  Box,
} from '@mantine/core';

interface FeedItemProps {
  item: FeedItemType;
}

export function FeedItem({ item }: FeedItemProps) {
  const router = useRouter();

  const handleUserClick = (handle: string) => {
    router.push(`/profile/${handle}`);
  };

  const handleCollectionClick = (collectionId: string) => {
    router.push(`/collections/${collectionId}`);
  };

  const renderActivityText = () => {
    const { user, collections } = item;
    
    if (collections.length === 0) {
      return (
        <Text size="sm" c="dimmed">
          <Anchor
            component="button"
            onClick={() => handleUserClick(user.handle)}
            c="blue"
          >
            @{user.handle}
          </Anchor>
          {' '}added to library
        </Text>
      );
    }

    if (collections.length === 1) {
      return (
        <Text size="sm" c="dimmed">
          <Anchor
            component="button"
            onClick={() => handleUserClick(user.handle)}
            c="blue"
          >
            @{user.handle}
          </Anchor>
          {' '}added to{' '}
          <Anchor
            component="button"
            onClick={() => handleCollectionClick(collections[0].id)}
            c="blue"
          >
            {collections[0].name}
          </Anchor>
        </Text>
      );
    }

    return (
      <Text size="sm" c="dimmed">
        <Anchor
          component="button"
          onClick={() => handleUserClick(user.handle)}
          c="blue"
        >
          @{user.handle}
        </Anchor>
        {' '}added to{' '}
        {collections.map((collection, index) => (
          <span key={collection.id}>
            <Anchor
              component="button"
              onClick={() => handleCollectionClick(collection.id)}
              c="blue"
            >
              {collection.name}
            </Anchor>
            {index < collections.length - 2 && ', '}
            {index === collections.length - 2 && ' and '}
          </span>
        ))}
      </Text>
    );
  };

  return (
    <Stack gap="xs">
      {renderActivityText()}
      <Box pl="md">
        <UrlCard
          cardId={item.card.id}
          url={item.card.url}
          title={item.card.cardContent.title}
          description={item.card.cardContent.description}
          author={item.card.cardContent.author}
          imageUrl={item.card.cardContent.thumbnailUrl}
          addedAt={item.card.createdAt}
          note={item.card.note?.text}
        />
      </Box>
    </Stack>
  );
}
