import { ApiClient } from '@/api-client/ApiClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function useRemoveCardFromCollections() {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000',
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
      return apiClient.removeCardFromCollection({ cardId, collectionIds });
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
