import type { Metadata } from 'next';
import Header from '@/components/navigation/header/Header';
import { Fragment } from 'react';
import { getDomain, getUrlFromSlug } from '@/lib/utils/link';
import { getUrlMetadata } from '@/features/cards/lib/dal';

interface Props {
  params: Promise<{ url: string[] }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { url } = await params;
  const formattedUrl = getUrlFromSlug(url);
  const { metadata } = await getUrlMetadata(formattedUrl);
  const domain = getDomain(formattedUrl);
  const title = metadata.title ? `${metadata.title} (${domain})` : formattedUrl;

  return {
    title: `Semble | ${title}`,
    description: `Semble page for ${title}`,
    openGraph: {
      images: [
        {
          url: `${process.env.APP_URL}/api/opengraph/semble?url=${formattedUrl}`,
          width: 1200,
          height: 630,
          alt: `Semble page for ${domain}`,
        },
      ],
    },
  };
}

export default async function Layout(props: Props) {
  return (
    <Fragment>
      <Header />
      {props.children}
    </Fragment>
  );
}
