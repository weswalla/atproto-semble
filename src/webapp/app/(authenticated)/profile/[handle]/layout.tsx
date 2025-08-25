import Header from '@/components/navigation/header/Header';
import type { Metadata } from 'next';
import { Fragment } from 'react';

interface Props {
  params: Promise<{ handle: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;

  return {
    title: handle,
    description: 'Profile',
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
