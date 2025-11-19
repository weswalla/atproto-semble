import { Stack, Image, Grid, GridCol, Card } from '@mantine/core';
import { getUrlMetadata } from '@/features/cards/lib/dal';
import UrlAddedBySummary from '../urlAddedBySummary/UrlAddedBySummary';
import { Suspense } from 'react';
import SembleActionsContainerSkeleton from '../../containers/sembleActionsContainer/Skeleton.SembleActionsContainer';
import SembleActionsContainer from '../../containers/sembleActionsContainer/SembleActionsContainer';
import UrlMetadataHeader from '../urlMetadataHeader/UrlMetadataHeader';
import UrlMetadataHeaderSkeleton from '../urlMetadataHeader/Skeleton.UrlMetadataHeader';

interface Props {
  url: string;
}

export default async function SembleHeader(props: Props) {
  const { metadata } = await getUrlMetadata(props.url);

  return (
    <Stack gap={'xl'}>
      <Grid gutter={'lg'} justify="space-between">
        <GridCol span={{ base: 'auto' }}>
          <Suspense fallback={<UrlMetadataHeaderSkeleton />}>
            <UrlMetadataHeader url={props.url} />
          </Suspense>
        </GridCol>
        <GridCol span={{ base: 12, sm: 'content' }}>
          <Stack gap={'sm'} align="center">
            {metadata.imageUrl && (
              <Card p={0} radius={'md'} withBorder>
                <Image
                  src={metadata.imageUrl}
                  alt={`${props.url} social preview image`}
                  mah={150}
                  w={'auto'}
                  maw={'100%'}
                  fit="contain"
                />
              </Card>
            )}

            <Stack align="center">
              <Suspense fallback={<SembleActionsContainerSkeleton />}>
                <SembleActionsContainer url={props.url} />
              </Suspense>
            </Stack>
          </Stack>
        </GridCol>
      </Grid>
      <UrlAddedBySummary url={props.url} />
    </Stack>
  );
}
