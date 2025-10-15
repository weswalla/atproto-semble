import SembleContaier from '@/features/semble/containers/sembleContainer/SembleContainer';

interface Props {
  params: Promise<{ url: string[] }>;
}

export default async function Page(props: Props) {
  const { url } = await props.params;

  return <SembleContaier url={url.join()} />;
}
