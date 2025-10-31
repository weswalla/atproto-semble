import { createSembleClient } from '@/services/apiClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cardKeys } from '../cardKeys';
import { collectionKeys } from '@/features/collections/lib/collectionKeys';

export default function useUpdateCardAssociations() {
  const client = createSembleClient();

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (updatedCard: {
      cardId: string;
      note?: string;
      addToCollectionIds?: string[];
      removeFromCollectionIds?: string[];
    }) => {
      return client.updateUrlCardAssociations({
        cardId: updatedCard.cardId,
        note: updatedCard.note,
        addToCollections: updatedCard.addToCollectionIds,
        removeFromCollections: updatedCard.removeFromCollectionIds,
      });
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: cardKeys.all() });
      queryClient.invalidateQueries({ queryKey: collectionKeys.mine() });

      // invalidate each collection query individually
      variables.addToCollectionIds?.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: collectionKeys.collection(id),
        });
      });

      variables.removeFromCollectionIds?.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: collectionKeys.collection(id),
        });
      });
    },
  });

  return mutation;
}
