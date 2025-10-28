import { useSuspenseQuery, useQuery } from '@tanstack/react-query';
import { getMyProfile } from '../dal';

export default function useMyProfile() {
  return useSuspenseQuery({
    queryKey: ['my profile'],
    queryFn: () => getMyProfile(),
  });
}
