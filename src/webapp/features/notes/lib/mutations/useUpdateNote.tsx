import { ApiClient } from '@/api-client/ApiClient';
import { createClientTokenManager } from '@/services/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function useUpdateNote() {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000',
    createClientTokenManager(),
  );

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (note: { cardId: string; note: string }) => {
      return apiClient.updateNoteCard(note);
    },

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['card', data.cardId] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  return mutation;
}
