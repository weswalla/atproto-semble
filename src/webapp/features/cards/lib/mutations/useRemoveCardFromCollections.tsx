import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeCardFromCollection } from '../dal';

export default function useRemoveCardFromCollections() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      cardId,
      collectionIds,
    }: {
      cardId: string;
      collectionIds: string[];
    }) => {
      return removeCardFromCollection({ cardId, collectionIds });
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
