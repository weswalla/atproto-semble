'use client';

import CollectionsContainerError from '@/features/collections/containers/collectionsContainer/Error.CollectionsContainer';
import { Container } from '@mantine/core';

export default function Error() {
  return (
    <Container p="xs" size="xl">
      <CollectionsContainerError />
    </Container>
  );
}
