import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import {
  ColorSchemeScript,
  mantineHtmlProps,
  MantineProvider,
} from '@mantine/core';
import '@mantine/core/styles.css';
import { AuthProvider } from '@/hooks/useAuth';
import { theme } from '@/styles/theme';

export const metadata: Metadata = {
  title: 'Semble',
  description: 'A social knowledge tool for researchers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <AuthProvider>{children}</AuthProvider>
        </MantineProvider>
        <Analytics />
      </body>
    </html>
  );
}
