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
import { Hanken_Grotesk } from 'next/font/google';

export const metadata: Metadata = {
  title: 'Semble | A social knowledge network for researchers',
  description: `Follow your peers' research trails. Surface and discover new connections. Built on ATProto so you own your data.`,
};

const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${hankenGrotesk.className}`}
      {...mantineHtmlProps}
    >
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
