'use client';

import { useColorScheme } from '@mantine/hooks';
import BG from '@/assets/semble-header-bg.webp';
import DarkBG from '@/assets/semble-header-bg-dark.webp';
import { Box, Image } from '@mantine/core';

export default function SembleHeaderBackground() {
  const colorScheme = useColorScheme();

  return (
    <Box style={{ position: 'relative', width: '100%' }}>
      <Image
        src={colorScheme === 'dark' ? DarkBG.src : BG.src}
        alt="bg"
        fit="cover"
        w="100%"
        h={80}
      />

      {/* White gradient overlay */}
      <Box
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '60%', // fade height
          background:
            'linear-gradient(to top, var(--mantine-color-body), transparent)',
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
}
