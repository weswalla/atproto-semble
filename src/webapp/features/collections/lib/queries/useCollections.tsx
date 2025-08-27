import { ApiClient } from '@/api-client/ApiClient';
import { getAccessToken } from '@/services/auth';
import { useSuspenseQuery } from '@tanstack/react-query';

interface Props {
  limit?: number;
}

export default function useCollections(props?: Props) {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => getAccessToken(),
  );

  const collections = useSuspenseQuery({
    queryKey: ['collections', props?.limit],
    queryFn: () => apiClient.getMyCollections({ limit: props?.limit ?? 50 }),
  });

  return collections;
}
