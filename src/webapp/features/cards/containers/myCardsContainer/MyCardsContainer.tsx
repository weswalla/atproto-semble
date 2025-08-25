'use client';

import { Container, Grid, Stack, Title, Button, Text } from '@mantine/core';
import useMyCards from '../../lib/queries/useMyCards';
import UrlCard from '@/features/cards/components/urlCard/UrlCard';
import { BiPlus } from 'react-icons/bi';
import Link from 'next/link';

export default function MyCardsContainer() {
  const { data, error } = useMyCards();

  return (
    <Container p={'xs'} fluid>
      <Stack>
        <Title order={1}>My Cards</Title>
        {data && data.cards.length > 0 && (
          <Grid gutter={'md'} grow>
            {data.cards.map((card) => (
              <Grid.Col
                key={card.id}
                span={{ base: 12, xs: 6, sm: 2, lg: 2, xl: 2 }}
              >
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
        )}
        {data && data.cards.length === 0 && (
          <Stack align="center" gap={'xs'}>
            <Text fz={'h3'} fw={600} c={'gray'}>
              No cards
            </Text>
            <Button
              component={Link}
              href={'/cards/add'}
              variant="light"
              color={'gray'}
              size="md"
              rightSection={<BiPlus size={22} />}
            >
              Add your first card
            </Button>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
