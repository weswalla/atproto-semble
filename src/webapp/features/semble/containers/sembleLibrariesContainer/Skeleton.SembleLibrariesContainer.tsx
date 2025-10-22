import { Divider, Grid, GridCol } from '@mantine/core';
import AddedByCardSkeleton from '../../components/addedByCard/Skeleton.AddedByCard';

export default function SembleLibrariesContainerSkeleton() {
  return (
    <Grid gutter="md">
      <GridCol
        span={{
          base: 12,
        }}
      >
        <AddedByCardSkeleton />
        <AddedByCardSkeleton />
        <AddedByCardSkeleton />
        <AddedByCardSkeleton />
      </GridCol>
    </Grid>
  );
}
