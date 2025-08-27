'use client';

import {
  Button,
  Container,
  Stack,
  Title,
  Text,
  SimpleGrid,
} from '@mantine/core';
import useCollections from '../../lib/queries/useCollections';
import { BiPlus } from 'react-icons/bi';
import CollectionCard from '../../components/collectionCard/CollectionCard';
import { useContextDrawers } from '@/providers/drawers';

export default function CollectionsContainer() {
  const { data } = useCollections();
  const drawers = useContextDrawers();

  return (
    <Container p={'xs'} size={'xl'}>
      <Stack>
        <Title order={1}>Collections</Title>

        {data.collections.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={'md'}>
            {data.collections.map((c) => (
              <CollectionCard key={c.id} collection={c} />
            ))}
          </SimpleGrid>
        ) : (
          <Stack align="center" gap={'xs'}>
            <Text fz={'h3'} fw={600} c={'gray'}>
              No collections
            </Text>
            <Button
              onClick={() => drawers.open({ drawer: 'createCollection' })}
              variant="light"
              color={'gray'}
              size="md"
              rightSection={<BiPlus size={22} />}
            >
              Create your first collection
            </Button>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
