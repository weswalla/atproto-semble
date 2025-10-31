import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCollection } from '../dal';
import { collectionKeys } from '../collectionKeys';

export default function useDeleteCollection() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (collectionId: string) => {
      return deleteCollection(collectionId);
    },

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all() });
    },
  });

  return mutation;
}
