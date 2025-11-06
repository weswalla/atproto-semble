import { useSuspenseQuery } from '@tanstack/react-query';
import { getUrlMetadata } from '../dal';

interface Props {
  url: string;
}

export default function useUrlMetadata(props: Props) {
  const metadata = useSuspenseQuery({
    queryKey: [props.url],
    queryFn: () => getUrlMetadata(props.url),
  });
  return metadata;
}
