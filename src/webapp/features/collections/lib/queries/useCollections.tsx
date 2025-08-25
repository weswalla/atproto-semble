import { ApiClient } from '@/api-client/ApiClient';
import { getAccessToken } from '@/services/auth';
import { useSuspenseQuery } from '@tanstack/react-query';

export default function useCollections() {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => getAccessToken(),
  );

  const collections = useSuspenseQuery({
    queryKey: ['collections'],
    queryFn: () => apiClient.getMyCollections({ limit: 50 }),
  });

  return collections;
}
