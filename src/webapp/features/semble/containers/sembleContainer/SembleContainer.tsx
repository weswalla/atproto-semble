import SembleHeader from '../../components/SembleHeader/SembleHeader';
import { BackgroundImage, Container, Stack } from '@mantine/core';
import BG from '@/assets/semble-bg.webp';
import { Suspense } from 'react';
import SembleTabs from '../../components/sembleTabs/SembleTabs';
import SembleHeaderSkeleton from '../../components/SembleHeader/Skeleton.SembleHeader';

interface Props {
  url: string;
}

export default async function SembleContainer(props: Props) {
  return (
    <Container p={0} fluid>
      <BackgroundImage src={BG.src} h={350}>
        <Container p={'xs'} size={'xl'}>
          <Stack gap={'xl'}>
            <Suspense fallback={<SembleHeaderSkeleton />}>
              <SembleHeader url={props.url} />
            </Suspense>
            <SembleTabs url={props.url} />
          </Stack>
        </Container>
      </BackgroundImage>
    </Container>
  );
}
