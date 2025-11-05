import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeCardFromCollection } from '../dal';
import { collectionKeys } from '@/features/collections/lib/collectionKeys';

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
      queryClient.invalidateQueries({ queryKey: collectionKeys.infinite() });
      queryClient.invalidateQueries({ queryKey: collectionKeys.mine() });

      variables.collectionIds.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: collectionKeys.collection(id),
        });
        queryClient.invalidateQueries({
          queryKey: collectionKeys.infinite(id),
        });
      });
    },
  });

  return mutation;
}
