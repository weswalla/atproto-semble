import { ApiClient } from '@/api-client/ApiClient';
import { getAccessToken } from '@/services/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function useRemoveCardFromLibrary() {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => getAccessToken(),
  );

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (cardId: string) => {
      return apiClient.removeCardFromLibrary({ cardId });
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my cards'] });
    },
  });

  return mutation;
}
