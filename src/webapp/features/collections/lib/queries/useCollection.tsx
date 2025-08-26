import { ApiClient } from '@/api-client/ApiClient';
import { getAccessToken } from '@/services/auth';
import { useSuspenseQuery } from '@tanstack/react-query';

interface Props {
  id: string;
}

export default function useCollection(props: Props) {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => getAccessToken(),
  );

  // TODO: replace with infinite suspense query
  const collection = useSuspenseQuery({
    queryKey: ['collection', props.id],
    queryFn: () =>
      apiClient.getCollectionPage(props.id, {
        limit: 50,
      }),
  });

  return collection;
}
