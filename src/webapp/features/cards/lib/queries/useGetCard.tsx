import { ApiClient } from '@/api-client/ApiClient';
import { useSuspenseQuery } from '@tanstack/react-query';

interface Props {
  id: string;
}

export default function useGetCard(props: Props) {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000',
  );

  const card = useSuspenseQuery({
    queryKey: ['card', props.id],
    queryFn: () => apiClient.getUrlCardView(props.id),
  });

  return card;
}
