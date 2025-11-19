import { Stack, Grid, GridCol, Skeleton } from '@mantine/core';
import UrlAddedBySummarySkeleton from '../urlAddedBySummary/Skeleton.UrlAddedBySummary';
import SembleActionsContainerSkeleton from '../../containers/sembleActionsContainer/Skeleton.SembleActionsContainer';
import UrlMetadataHeaderSkeleton from '../urlMetadataHeader/Skeleton.UrlMetadataHeader';

export default function SembleHeaderSkeleton() {
  return (
    <Stack gap={'xl'}>
      <Grid gutter={'lg'} justify="space-between">
        <GridCol span={{ base: 'auto' }}>
          <UrlMetadataHeaderSkeleton />
        </GridCol>
        <GridCol span={{ base: 12, sm: 'content' }}>
          <Stack gap={'sm'} align="center" flex={1}>
            <Skeleton h={150} w={300} maw={'100%'} />

            <SembleActionsContainerSkeleton />
          </Stack>
        </GridCol>
      </Grid>

      {/* URL added by summay */}
      <UrlAddedBySummarySkeleton />
    </Stack>
  );
}
