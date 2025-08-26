import CollectionContainer from '@/features/collections/containers/collectionContainer/CollectionContainer';

interface Props {
  params: Promise<{ collectionId: string }>;
}

export default async function Page(props: Props) {
  const { collectionId } = await props.params;

  return <CollectionContainer id={collectionId} />;
}
