import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeCardFromLibrary } from '../dal';
import { cardKeys } from '../cardKeys';
import { collectionKeys } from '@/features/collections/lib/collectionKeys';

export default function useRemoveCardFromLibrary() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (cardId: string) => {
      return removeCardFromLibrary(cardId);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.all() });
      queryClient.invalidateQueries({ queryKey: collectionKeys.all() });
    },
  });

  return mutation;
}
