import { Stack } from '@mantine/core';
import UrlCard from '@/features/cards/components/urlCard/UrlCard';
import FeedActivityStatus from '../feedActivityStatus/FeedActivityStatus';
import type { FeedItem as FeedItemType } from '@/api-client';

interface Props {
  item: FeedItemType;
}

export default function FeedItem(props: Props) {
  return (
    <Stack gap={'xs'} align="stretch">
      <FeedActivityStatus
        user={props.item.user}
        collections={props.item.collections}
        createdAt={props.item.createdAt}
      />
      <UrlCard
        id={props.item.card.id}
        url={props.item.card.url}
        cardContent={props.item.card.cardContent}
        urlLibraryCount={props.item.card.urlLibraryCount}
        urlIsInLibrary={props.item.card.urlInLibrary}
        authorHandle={props.item.user.handle}
      />
    </Stack>
  );
}
