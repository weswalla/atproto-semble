import { Container, SimpleGrid, Stack } from '@mantine/core';
import CollectionCardSkeleton from '@/features/collections/components/collectionCard/Skeleton.CollectionCard';

export default function SembleCollectionsContainerSkeleton() {
  return (
    <Container p="xs" size="xl">
      <Stack>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {Array.from({ length: 4 }).map((_, i) => (
            <CollectionCardSkeleton key={i} />
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
