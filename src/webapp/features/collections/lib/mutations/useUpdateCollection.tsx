import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCollection } from '../dal';

export default function useUpdateCollection() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (collection: {
      collectionId: string;
      rkey: string;
      name: string;
      description?: string;
    }) => {
      return updateCollection(collection);
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
