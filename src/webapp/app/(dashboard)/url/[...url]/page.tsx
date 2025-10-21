import SembleContainer from '@/features/semble/containers/sembleContainer/SembleContainer';
import { getUrlFromSlug } from '@/lib/utils/link';
import SembleAside from '@/features/semble/containers/sembleAside/SembleAside';
import { Fragment, Suspense } from 'react';
import SembleAsideSkeleton from '@/features/semble/containers/sembleAside/Skeleton.SembleAside';

interface Props {
  params: Promise<{ url: string[] }>;
}

export default async function Page(props: Props) {
  const { url } = await props.params;
  const formattedUrl = getUrlFromSlug(url);

  return (
    <Fragment>
      <SembleContainer url={formattedUrl} />
      <Suspense fallback={<SembleAsideSkeleton />} key={formattedUrl}>
        <SembleAside url={formattedUrl} />
      </Suspense>
    </Fragment>
  );
}
