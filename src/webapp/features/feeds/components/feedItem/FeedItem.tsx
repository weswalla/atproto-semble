import { Stack } from '@mantine/core';
import UrlCard from '@/features/cards/components/urlCard/UrlCard';
import FeedActivityStatus from '../feedActivityStatus/FeedActivityStatus';
import type { FeedItem as FeedItemType } from '@/api-client/types';

interface Props {
  item: FeedItemType;
}

export default function FeedItem(props: Props) {
  return (
    <Stack gap={'xs'}>
      <FeedActivityStatus
        user={props.item.user}
        collections={props.item.collections}
      />
      <UrlCard
        id={props.item.card.id}
        url={props.item.card.url}
        cardContent={props.item.card.cardContent}
        authorHandle={props.item.user.handle}
      />
    </Stack>
  );
}
