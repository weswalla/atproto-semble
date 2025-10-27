import { useSuspenseQuery, useQuery } from '@tanstack/react-query';
import { getMyProfile } from '../dal';
import { useAuth } from '@/hooks/useAuth';

export default function useMyProfile() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // don't trigger Suspense
    return { data: null };
  }

  return useSuspenseQuery({
    queryKey: ['my profile'],
    queryFn: () => getMyProfile(),
  });
}
