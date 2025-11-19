import UrlCardSkeleton from '@/features/cards/components/urlCard/Skeleton.UrlCard';
import { Grid, GridCol, Stack } from '@mantine/core';

export default function SembleSimilarCardsContainerSkeleton() {
  return (
    <Stack>
      <Grid gutter="md">
        {/* not necessary to check if navbar is open */}
        {Array.from({ length: 8 }).map((_, i) => (
          <GridCol key={i} span={12}>
            <UrlCardSkeleton />
          </GridCol>
        ))}
      </Grid>
    </Stack>
  );
}
