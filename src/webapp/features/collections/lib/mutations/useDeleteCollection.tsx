import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCollection } from '../dal';

export default function useDeleteCollection() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (collectionId: string) => {
      return deleteCollection(collectionId);
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
