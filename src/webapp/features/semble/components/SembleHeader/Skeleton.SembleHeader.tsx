import { Stack, Grid, GridCol, Text, Skeleton } from '@mantine/core';
import UrlAddedBySummarySkeleton from '../urlAddedBySummary/Skeleton.UrlAddedBySummary';

export default function SembleHeaderSkeleton() {
  return (
    <Stack gap={'xl'}>
      <Grid gutter={'lg'} justify="space-between">
        <GridCol span={{ base: 'auto' }}>
          <Stack>
            <Stack gap={0}>
              <Text fw={700} c="tangerine" span>
                Semble
              </Text>

              {/* Title */}
              <Skeleton w={'100%'} h={27} />
            </Stack>

            {/* Description */}
            <Stack gap={5}>
              <Skeleton w={'80%'} h={22} />
              <Skeleton w={'80%'} h={22} />
              <Skeleton w={'80%'} h={22} />
            </Stack>
          </Stack>
        </GridCol>
        <GridCol span={{ base: 12, sm: 'content' }}>
          <Stack gap={'sm'} align="start" flex={1}>
            <Skeleton radius={'lg'} h={150} w={300} maw={'100%'} />

            {/*<SembleActions />*/}
          </Stack>
        </GridCol>
      </Grid>

      {/* URL added by summay */}
      <UrlAddedBySummarySkeleton />
    </Stack>
  );
}
