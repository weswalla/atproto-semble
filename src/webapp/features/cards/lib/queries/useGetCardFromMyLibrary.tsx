import { ApiClient } from '@/api-client/ApiClient';
import { useSuspenseQuery } from '@tanstack/react-query';

interface Props {
  url: string;
}

export default function useGetCardFromMyLibrary(props: Props) {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000',
  );

  const cardStatus = useSuspenseQuery({
    queryKey: ['card from my library', props.url],
    queryFn: () => apiClient.getUrlStatusForMyLibrary({ url: props.url }),
  });

  return cardStatus;
}
