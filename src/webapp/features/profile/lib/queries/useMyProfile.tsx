import { ApiClient } from '@/api-client/ApiClient';
import { getAccessToken } from '@/services/auth';
import { useQuery } from '@tanstack/react-query';

export default function useMyProfile() {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => getAccessToken(),
  );

  const { data, error, isPending } = useQuery({
    queryKey: ['my profile'],
    queryFn: async () => {
      const profile = await apiClient.getMyProfile();
      if (!profile) {
        throw new Error('Could not get my profile');
      }
      return profile;
    },
  });

  return { data, error, isPending };
}
