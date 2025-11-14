import { Container, Select, SimpleGrid, Stack } from '@mantine/core';
import CollectionCardSkeleton from '../../components/collectionCard/Skeleton.CollectionCard';

export default function CollectionsContainerSkeleton() {
  return (
    <Container p="xs" size="xl">
      <Stack>
        <Select mr={'auto'} size="sm" label="Sort by" />

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {Array.from({ length: 4 }).map((_, i) => (
            <CollectionCardSkeleton key={i} />
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
