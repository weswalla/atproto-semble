import { Container, Grid, GridCol, Stack, Title } from '@mantine/core';
import UrlCardSkeleton from '../../components/urlCard/Skeleton.UrlCard';

export default function MyCardsContainerSkeleton() {
  return (
    <Container p="xs" size="xl">
      <Stack>
        <Title order={1}>My Cards</Title>

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
