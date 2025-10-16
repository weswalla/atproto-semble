import { ApiClient } from '@/api-client/ApiClient';
import { createClientTokenManager } from '@/services/auth';
import { useSuspenseQuery } from '@tanstack/react-query';

interface Props {
  id: string;
}

export default function useGetLibrariesForCard(props: Props) {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000',
    createClientTokenManager(),
  );

  const libraries = useSuspenseQuery({
    queryKey: ['libraries for card', props.id],
    queryFn: () => apiClient.getLibrariesForCard(props.id),
  });

  return libraries;
}
