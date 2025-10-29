import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeCardFromLibrary } from '../dal';

export default function useRemoveCardFromLibrary() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (cardId: string) => {
      return removeCardFromLibrary(cardId);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my cards'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
    },
  });

  return mutation;
}
