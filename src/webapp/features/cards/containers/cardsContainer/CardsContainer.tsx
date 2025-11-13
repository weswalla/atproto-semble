'use client';

import {
  Container,
  Grid,
  GridCol,
  Select,
  Skeleton,
  Stack,
} from '@mantine/core';
import { Suspense, useState } from 'react';
import { CardSortField } from '@semble/types';
import CardsContainerContent from '../cardsContainerContent/CardsContainerContent';
import UrlCardSkeleton from '../../components/urlCard/Skeleton.UrlCard';
import CardsContainerContentSkeleton from '../cardsContainerContent/Skeleton.CardsContainerContent';

interface Props {
  handle: string;
}

export default function CardsContainer(props: Props) {
  const [sortBy, setSortBy] = useState<CardSortField>(CardSortField.CREATED_AT);

  return (
    <Container p="xs" size="xl">
      <Stack>
        <Select
          mr={'auto'}
          size="sm"
          label="Sort by"
          value={sortBy}
          onChange={(value) => setSortBy(value as CardSortField)}
          data={[
            { value: CardSortField.CREATED_AT, label: 'Created (Newest)' },
            { value: CardSortField.UPDATED_AT, label: 'Updated (Newest)' },
            { value: CardSortField.LIBRARY_COUNT, label: 'Most Popular' },
          ]}
        />
        <Suspense fallback={<CardsContainerContentSkeleton />}>
          <CardsContainerContent handle={props.handle} sortBy={sortBy} />
        </Suspense>
      </Stack>
    </Container>
  );
}
