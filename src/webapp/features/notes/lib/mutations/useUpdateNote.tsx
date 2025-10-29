import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateNoteCard } from '../dal';

export default function useUpdateNote() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (note: { cardId: string; note: string }) => {
      return updateNoteCard(note);
    },

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['card', data.cardId] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  return mutation;
}
