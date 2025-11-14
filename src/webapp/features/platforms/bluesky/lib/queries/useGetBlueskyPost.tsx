import { useSuspenseQuery } from '@tanstack/react-query';
import { blueskyKeys } from '../blueskyKeys';
import { getBlueskyPost } from '../dal';

interface Props {
  uri: string;
}

export default function useGetBlueskyPost(props: Props) {
  const post = useSuspenseQuery({
    queryKey: blueskyKeys.post(props.uri),
    queryFn: () => getBlueskyPost(props.uri),
  });

  return post;
}
