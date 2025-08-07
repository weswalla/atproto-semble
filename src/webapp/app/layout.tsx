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
  title: 'Semble',
  description: 'A social knowledge tool for researchers',
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
      </body>
    </html>
  );
}
