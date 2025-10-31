import { useSuspenseQuery } from '@tanstack/react-query';
import { getProfile } from '../dal';
import { profileKeys } from '../profileKeys';

interface Props {
  didOrHandle: string;
}

export default function useProfile(props: Props) {
  const profile = useSuspenseQuery({
    queryKey: profileKeys.profile(props.didOrHandle),
    queryFn: () => getProfile(props.didOrHandle),
  });

  return profile;
}
