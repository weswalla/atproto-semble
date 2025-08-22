'use client';

import {
  Button,
  Container,
  Stack,
  Title,
  Text,
  Loader,
  Alert,
  SimpleGrid,
} from '@mantine/core';
import useCollections from '../../lib/queries/useCollections';
import Link from 'next/link';
import { BiPlus } from 'react-icons/bi';
import CollectionCard from '../../components/collectionCard/CollectionCard';

export default function CollectionsContainer() {
  const { data, error, isPending } = useCollections();

  return (
    <Container p={'xs'} fluid>
      <Stack>
        <Title order={1}>Collections</Title>

        {(isPending || !data) && <Loader />}
        {error && (
          <Alert
            variant="white"
            color="red"
            title="Could not load collections"
          />
        )}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={'md'}>
          {data &&
            data.collections &&
            data.collections.length > 0 &&
            data.collections.map((c) => (
              <CollectionCard key={c.id} collection={c} />
            ))}
        </SimpleGrid>
        {data && data.collections.length === 0 && (
          <Stack align="center" gap={'xs'}>
            <Text fz={'h3'} fw={600} c={'gray'}>
              No collections
            </Text>
            <Button
              component={Link}
              href={'/collections/create'}
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
