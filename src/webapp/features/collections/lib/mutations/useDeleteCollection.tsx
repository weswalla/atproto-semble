import { ApiClient } from '@/api-client/ApiClient';
import { createClientTokenManager } from '@/services/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function useDeleteCollection() {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    createClientTokenManager(),
  );

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (collectionId: string) => {
      return apiClient.deleteCollection({ collectionId });
    },

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({
        queryKey: ['collection', data.collectionId],
      });
    },
  });

  return mutation;
}
