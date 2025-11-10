import BackButton from '@/components/navigation/backButton/BackButton';
import Header from '@/components/navigation/header/Header';
import { getCollectionPageByAtUri } from '@/features/collections/lib/dal';
import { truncateText } from '@/lib/utils/text';
import type { Metadata } from 'next';
import { Fragment } from 'react';

interface Props {
  params: Promise<{ rkey: string; handle: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { rkey, handle } = await params;

  const collection = await getCollectionPageByAtUri({
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

export default async function Layout(props: Props) {
  const { handle } = await props.params;

  return (
    <Fragment>
      <Header>
        <BackButton
          href={`/profile/${handle}/collections`}
        >{`@${truncateText(handle, 20)}`}</BackButton>
      </Header>
      {props.children}
    </Fragment>
  );
}
