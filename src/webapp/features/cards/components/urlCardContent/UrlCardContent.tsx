import { detectUrlPlatform, SupportedPlatform } from '@/lib/utils/link';
import { UrlCard } from '@semble/types';
import SembleCollectionCardContent from './SembleCollectionCardContent';
import LinkCardContent from './LinkCardContent';

interface Props {
  url: string;
  cardContent: UrlCard['cardContent'];
}

export default function UrlCardContent(props: Props) {
  const platform = detectUrlPlatform(props.url);

  if (platform === SupportedPlatform.SEMBLE_COLLECTION) {
    return <SembleCollectionCardContent cardContent={props.cardContent} />;
  }

  return <LinkCardContent cardContent={props.cardContent} />;
}
