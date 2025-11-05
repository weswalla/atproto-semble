import { Image, Container, Stack, Box } from '@mantine/core';
import BG from '@/assets/semble-header-bg.webp';
import SembleHeaderSkeleton from '../../components/SembleHeader/Skeleton.SembleHeader';

export default function SembleContainerSkeleton() {
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
          <SembleHeaderSkeleton />
        </Stack>
      </Container>
    </Container>
  );
}
