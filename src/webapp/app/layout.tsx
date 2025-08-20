import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import { Hanken_Grotesk } from 'next/font/google';
import Providers from '@/providers';

export const metadata: Metadata = {
  title: {
    template: 'Semble | %s',
    default: 'Semble | A social knowledge network for researchers',
  },
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
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
