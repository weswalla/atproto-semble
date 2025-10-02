import type { MetadataRoute } from 'next';
import { theme } from '@/styles/theme';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Semble',
    short_name: 'Semble',
    description: 'A social knowledge network for researchers',
    start_url: '/home',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: theme.colors?.orange?.[6],
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
