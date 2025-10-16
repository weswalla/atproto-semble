import { ApiClient } from '@/api-client/ApiClient';
import { createClientTokenManager } from '@/services/auth';
import type { Metadata } from 'next';
import { Fragment } from 'react';

interface Props {
  params: Promise<{ handle: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;

  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000',
    createClientTokenManager(),
  );

  const profile = await apiClient.getProfile({
    identifier: handle,
  });

  return {
    title: `${profile.name}'s cards`,
    description: `Explore ${profile.name}'s cards on Semble`,
  };
}

interface Props {
  children: React.ReactNode;
}

export default function Layout(props: Props) {
  return <Fragment>{props.children}</Fragment>;
}
