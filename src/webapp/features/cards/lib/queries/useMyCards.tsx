import { ApiClient } from '@/api-client/ApiClient';
import { getAccessToken } from '@/services/auth';
import { useQuery } from '@tanstack/react-query';

export default function useMyCards() {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => getAccessToken(),
  );

  const { data, error, isPending } = useQuery({
    queryKey: ['my cards'],
    queryFn: async () => {
      const cards = await apiClient.getMyUrlCards({ limit: 10 });
      if (!cards) {
        throw new Error('Could not get my cards');
      }
      return cards;
    },
  });

  return { data, error, isPending };
}
