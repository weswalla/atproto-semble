import { Container, Stack } from '@mantine/core';
import SembleHeaderSkeleton from '../../components/SembleHeader/Skeleton.SembleHeader';
import SembleHeaderBackground from './SembleHeaderBackground';
import SembleAsideSkeleton from '../sembleAside/Skeleton.SembleAside';
import { Fragment } from 'react';

export default function SembleContainerSkeleton() {
  return (
    <Fragment>
      <Container p={0} fluid>
        <SembleHeaderBackground />
        <Container px={'xs'} pb={'xs'} size={'xl'}>
          <Stack gap={'xl'}>
            <SembleHeaderSkeleton />
          </Stack>
        </Container>
      </Container>
      <SembleAsideSkeleton />
    </Fragment>
  );
}
