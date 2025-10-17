import { ApiClient } from '@/api-client/ApiClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function useRemoveCardFromLibrary() {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000',
  );

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (cardId: string) => {
      return apiClient.removeCardFromLibrary({ cardId });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my cards'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
    },
  });

  return mutation;
}
