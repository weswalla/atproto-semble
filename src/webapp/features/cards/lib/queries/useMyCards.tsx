import { ApiClient } from '@/api-client/ApiClient';
import { getAccessToken } from '@/services/auth';
import { useQuery } from '@tanstack/react-query';

export default function useMyCards() {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => getAccessToken(),
  );

  const myCards = useQuery({
    queryKey: ['my cards'],
    queryFn: () => apiClient.getMyUrlCards({ limit: 10 }),
  });

  return myCards;
}
