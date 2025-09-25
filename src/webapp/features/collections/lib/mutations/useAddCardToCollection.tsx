import { ApiClient } from '@/api-client/ApiClient';
import { createClientTokenManager } from '@/services/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function useAddCardToCollection() {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    createClientTokenManager(),
  );

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      cardId,
      collectionIds,
    }: {
      cardId: string;
      collectionIds: string[];
    }) => {
      return apiClient.addCardToCollection({ cardId, collectionIds });
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['card', variables.cardId] });
      queryClient.invalidateQueries({ queryKey: ['my cards'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });

      variables.collectionIds.forEach((id) => {
        queryClient.invalidateQueries({ queryKey: ['collection', id] });
      });
    },
  });

  return mutation;
}
