import SembleHeader from '../../components/SembleHeader/SembleHeader';
import { Container, Stack } from '@mantine/core';
import { Suspense } from 'react';
import SembleTabs from '../../components/sembleTabs/SembleTabs';
import SembleHeaderSkeleton from '../../components/SembleHeader/Skeleton.SembleHeader';
import SembleHeaderBackground from './SembleHeaderBackground';

interface Props {
  url: string;
}

export default async function SembleContainer(props: Props) {
  return (
    <Container p={0} fluid>
      <SembleHeaderBackground />
      <Container px={'xs'} pb={'xs'} size={'xl'}>
        <Stack gap={'xl'}>
          <Suspense fallback={<SembleHeaderSkeleton />}>
            <SembleHeader url={props.url} />
          </Suspense>
          <SembleTabs url={props.url} />
        </Stack>
      </Container>
    </Container>
  );
}
