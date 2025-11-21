'use client';

import { Container, Stack, Title, Skeleton } from '@mantine/core';

export default function AppearanceContainerSkeleton() {
  return (
    <Container p="xs" size="xs">
      <Stack gap="xl">
        <Title order={1}>Appearance</Title>
        <Skeleton w={'100%'} h={42} />
      </Stack>
    </Container>
  );
}
