import SembleContainer from '@/features/semble/containers/sembleContainer/SembleContainer';
import { getUrlFromSlug } from '@/lib/utils/link';
import SembleAside from '@/features/semble/containers/sembleAside/SembleAside';
import { Fragment } from 'react';

interface Props {
  params: Promise<{ url: string[] }>;
}

export default async function Page(props: Props) {
  const { url } = await props.params;

  return (
    <Fragment>
      <SembleContainer url={getUrlFromSlug(url)} />
      <SembleAside url={getUrlFromSlug(url)} />
    </Fragment>
  );
}
