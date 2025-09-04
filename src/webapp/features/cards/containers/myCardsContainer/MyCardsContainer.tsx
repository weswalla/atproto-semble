'use client';

import { Container, Grid, Stack, Title, Button, Text } from '@mantine/core';
import useMyCards from '../../lib/queries/useMyCards';
import UrlCard from '@/features/cards/components/urlCard/UrlCard';
import { BiPlus } from 'react-icons/bi';
import Link from 'next/link';
import AddCardDrawer from '../../components/addCardDrawer/AddCardDrawer';
import { useState } from 'react';

export default function MyCardsContainer() {
  const { data } = useMyCards();
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  return (
    <Container p={'xs'} size={'xl'}>
      <Stack>
        <Title order={1}>My Cards</Title>
        {data.cards.length > 0 ? (
          <Grid gutter={'md'}>
            {data.cards.map((card) => (
              <Grid.Col key={card.id} span={{ base: 12, xs: 6, sm: 4, lg: 3 }}>
                <UrlCard
                  id={card.id}
                  url={card.url}
                  cardContent={card.cardContent}
                  note={card.note}
                  collections={card.collections}
                />
              </Grid.Col>
            ))}
          </Grid>
        ) : (
          <Stack align="center" gap={'xs'}>
            <Text fz={'h3'} fw={600} c={'gray'}>
              No cards
            </Text>
            <Button
              variant="light"
              color={'gray'}
              size="md"
              rightSection={<BiPlus size={22} />}
              onClick={() => setShowAddDrawer(true)}
            >
              Add your first card
            </Button>
            <AddCardDrawer
              isOpen={showAddDrawer}
              onClose={() => setShowAddDrawer(false)}
            />
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
