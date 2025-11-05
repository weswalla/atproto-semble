import SembleHeader from '../../components/SembleHeader/SembleHeader';
import { Image, Container, Stack, Box } from '@mantine/core';
import BG from '@/assets/semble-header-bg.webp';
import { Suspense } from 'react';
import SembleTabs from '../../components/sembleTabs/SembleTabs';
import SembleHeaderSkeleton from '../../components/SembleHeader/Skeleton.SembleHeader';

interface Props {
  url: string;
}

export default async function SembleContainer(props: Props) {
  return (
    <Container p={0} fluid>
      <Box style={{ position: 'relative', width: '100%' }}>
        <Image src={BG.src} alt="bg" fit="cover" w="100%" h={80} />

        {/* White gradient overlay */}
        <Box
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '60%', // fade height
            background: 'linear-gradient(to top, white, transparent)',
            pointerEvents: 'none',
          }}
        />
      </Box>
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
