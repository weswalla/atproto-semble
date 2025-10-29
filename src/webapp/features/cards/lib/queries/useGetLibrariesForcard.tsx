import { useSuspenseQuery } from '@tanstack/react-query';
import { getLibrariesForCard } from '../dal';

interface Props {
  id: string;
}

export default function useGetLibrariesForCard(props: Props) {
  const libraries = useSuspenseQuery({
    queryKey: ['libraries for card', props.id],
    queryFn: () => getLibrariesForCard(props.id),
  });

  return libraries;
}
