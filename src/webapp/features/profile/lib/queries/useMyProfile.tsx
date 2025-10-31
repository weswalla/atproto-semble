import { useSuspenseQuery } from '@tanstack/react-query';
import { getMyProfile } from '../dal';
import { profileKeys } from '../profileKeys';

export default function useMyProfile() {
  return useSuspenseQuery({
    queryKey: profileKeys.mine(),
    queryFn: () => getMyProfile(),
  });
}
