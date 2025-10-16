import { ApiClient } from '@/api-client/ApiClient';
import { createClientTokenManager } from '@/services/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function useAddCardToLibrary() {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000',
    createClientTokenManager(),
  );

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      url,
      note,
      collectionIds,
    }: {
      url: string;
      note?: string;
      collectionIds: string[];
    }) => {
      return apiClient.addUrlToLibrary({ url, note, collectionIds });
    },

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['card', data.urlCardId] });
      queryClient.invalidateQueries({ queryKey: ['card', data.noteCardId] });
      queryClient.invalidateQueries({ queryKey: ['card', variables.url] });
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
