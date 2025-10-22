import { ApiClient } from '@/api-client/ApiClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function useUpdateCollection() {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000',
  );

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (collection: {
      collectionId: string;
      rkey: string;
      name: string;
      description?: string;
    }) => {
      return apiClient.updateCollection(collection);
    },

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({
        queryKey: ['collection', data.collectionId],
      });
      queryClient.invalidateQueries({
        queryKey: ['collection', variables.rkey],
      });
    },
  });

  return mutation;
}
