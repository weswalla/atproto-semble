import { ApiClient } from '@/api-client/ApiClient';
import { createClientTokenManager } from '@/services/auth';
import { useSuspenseQuery } from '@tanstack/react-query';

export default function useMyProfile() {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000',
    createClientTokenManager(),
  );

  const myProfile = useSuspenseQuery({
    queryKey: ['my profile'],
    queryFn: () => apiClient.getMyProfile(),
  });

  return myProfile;
}
