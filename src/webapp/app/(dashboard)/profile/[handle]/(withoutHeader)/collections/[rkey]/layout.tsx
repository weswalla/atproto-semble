import { ApiClient } from '@/api-client/ApiClient';
import Header from '@/components/navigation/header/Header';
import { createClientTokenManager } from '@/services/auth';
import type { Metadata } from 'next';
import { Fragment } from 'react';

interface Props {
  params: Promise<{ rkey: string; handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { rkey, handle } = await params;

  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000',
    createClientTokenManager(),
  );

  const collection = await apiClient.getCollectionPageByAtUri({
    recordKey: rkey,
    handle: handle,
  });

  return {
    title: collection.name,
    description:
      collection.description ??
      `View ${collection.author.name}'s collection on Semble`,
  };
}

interface Props {
  children: React.ReactNode;
}

export default function Layout(props: Props) {
  return (
    <Fragment>
      <Header />
      {props.children}
    </Fragment>
  );
}
