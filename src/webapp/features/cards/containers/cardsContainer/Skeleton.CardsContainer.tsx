import { Container, Grid, GridCol, Stack } from '@mantine/core';
import UrlCardSkeleton from '../../components/urlCard/Skeleton.UrlCard';

export default function CardsContainerSkeleton() {
  return (
    <Container p="xs" size="xl">
      <Stack>
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
