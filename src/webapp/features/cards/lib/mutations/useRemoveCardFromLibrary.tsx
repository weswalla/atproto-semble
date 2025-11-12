import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeCardFromLibrary } from '../dal';
import { cardKeys } from '../cardKeys';
import { collectionKeys } from '@/features/collections/lib/collectionKeys';
import { noteKeys } from '@/features/notes/lib/noteKeys';
import { feedKeys } from '@/features/feeds/lib/feedKeys';
import { sembleKeys } from '@/features/semble/lib/sembleKeys';

export default function useRemoveCardFromLibrary() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (cardId: string) => {
      return removeCardFromLibrary(cardId);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.all() });
      queryClient.invalidateQueries({ queryKey: noteKeys.all() });
      queryClient.invalidateQueries({ queryKey: feedKeys.all() });
      queryClient.invalidateQueries({ queryKey: collectionKeys.all() });
      queryClient.invalidateQueries({ queryKey: sembleKeys.all() });
    },
  });

  return mutation;
}
