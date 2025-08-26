import { ApiClient } from '@/api-client/ApiClient';
import { getAccessToken } from '@/services/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function useCreateCollection() {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => getAccessToken(),
  );

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newCollection: { name: string; description: string }) => {
      return apiClient.createCollection(newCollection);
    },

    // Do things that are absolutely necessary and logic related (like query invalidation) in the useMutation callbacks
    // Do UI related things like redirects or showing toast notifications in mutate callbacks. If the user navigated away from the current screen before the mutation finished, those will purposefully not fire
    // https://tkdodo.eu/blog/mastering-mutations-in-react-query#some-callbacks-might-not-fire
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  return mutation;
}
