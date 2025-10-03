import UrlCardSkeleton from '@/features/cards/components/urlCard/Skeleton.UrlCard';
import {
  Container,
  Grid,
  GridCol,
  Group,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core';

export default function CollectionContainerSkeleton() {
  return (
    <Container p="xs" size="xl">
      <Stack justify="flex-start">
        <Group justify="space-between" align="start">
          <Stack gap={0}>
            <Text fw={700} c="grape">
              Collection
            </Text>
            {/* Title */}
            <Skeleton w={300} h={27} />

            {/* Description */}
            <Skeleton w={'80%'} h={22} mt={'lg'} />
          </Stack>

          <Stack>
            {/* By */}
            <Skeleton w={100} h={24} />
          </Stack>
        </Group>

        <Group justify="end">
          <Skeleton w={100} h={32} radius={'md'} />
          <Skeleton w={32} h={32} radius={'md'} />
        </Group>

        <Grid gutter="md">
          {Array.from({ length: 8 }).map((_, i) => (
            <GridCol key={i} span={{ base: 12, xs: 6, sm: 4, lg: 3 }}>
              <UrlCardSkeleton />
            </GridCol>
          ))}
        </Grid>
      </Stack>
    </Container>
  );
}
