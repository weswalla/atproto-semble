import { ApiClient } from '@/api-client/ApiClient';
import { createClientTokenManager } from '@/services/auth';
import { useSuspenseQuery } from '@tanstack/react-query';

interface Props {
  didOrHandle: string;
}

export default function useProfile(props: Props) {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    createClientTokenManager(),
  );

  const profile = useSuspenseQuery({
    queryKey: ['profile', props.didOrHandle],
    queryFn: () => apiClient.getProfile({ identifier: props.didOrHandle }),
  });

  return profile;
}
