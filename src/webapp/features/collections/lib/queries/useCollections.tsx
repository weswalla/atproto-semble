import { ApiClient } from '@/api-client/ApiClient';
import { getAccessToken } from '@/services/auth';
import { useQuery } from '@tanstack/react-query';

export default function useCollections() {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => getAccessToken(),
  );

  const { data, error, isPending } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const collections = await apiClient.getMyCollections({ limit: 50 });
      if (!collections) {
        throw new Error('Could not get collections');
      }
      return collections;
    },
  });

  return { data, error, isPending };
}
