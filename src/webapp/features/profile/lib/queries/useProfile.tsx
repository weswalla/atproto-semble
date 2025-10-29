import { useSuspenseQuery } from '@tanstack/react-query';
import { getProfile } from '../dal';

interface Props {
  didOrHandle: string;
}

export default function useProfile(props: Props) {
  const profile = useSuspenseQuery({
    queryKey: ['profile', props.didOrHandle],
    queryFn: () => getProfile(props.didOrHandle),
  });

  return profile;
}
