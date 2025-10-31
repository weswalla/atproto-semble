import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateNoteCard } from '../dal';
import { cardKeys } from '@/features/cards/lib/cardKeys';
import { collectionKeys } from '@/features/collections/lib/collectionKeys';

export default function useUpdateNote() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (note: { cardId: string; note: string }) => {
      return updateNoteCard(note);
    },

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: cardKeys.card(data.cardId) });
      queryClient.invalidateQueries({ queryKey: cardKeys.infinite() });
      queryClient.invalidateQueries({ queryKey: collectionKeys.all() });
    },
  });

  return mutation;
}
