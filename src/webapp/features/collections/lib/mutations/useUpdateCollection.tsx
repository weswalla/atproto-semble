import { ApiClient } from '@/api-client/ApiClient';
import { getAccessToken } from '@/services/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function useUpdateCollection() {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => getAccessToken(),
  );

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (collection: {
      collectionId: string;
      name: string;
      description?: string;
    }) => {
      return apiClient.updateCollection(collection);
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
