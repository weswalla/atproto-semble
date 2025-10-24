import type { UrlView } from '@/api-client';
import UrlCard from '@/features/cards/components/urlCard/UrlCard';

interface Props {
  urlView: UrlView;
}

export default function SimilarUrlCard({ urlView }: Props) {
  return (
    <UrlCard
      id={urlView.url} // use URL as ID
      url={urlView.url}
      cardContent={urlView.metadata} // metadata → cardContent
      urlLibraryCount={urlView.urlLibraryCount}
      urlIsInLibrary={urlView.urlInLibrary ?? false}
      // omit optional props that UrlView doesn't have
    />
  );
}
