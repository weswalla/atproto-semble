import { ApiClient } from '@/api-client/ApiClient';
import { getAccessToken } from '@/services/auth';
import { useSuspenseQuery } from '@tanstack/react-query';

export default function useMyProfile() {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => getAccessToken(),
  );

  const myProfile = useSuspenseQuery({
    queryKey: ['my profile'],
    queryFn: () => apiClient.getMyProfile(),
  });

  return myProfile;
}
