import { useSuspenseQuery } from '@tanstack/react-query';
import { getLibrariesForCard } from '../dal';
import { cardKeys } from '../cardKeys';

interface Props {
  id: string;
}

export default function useGetLibrariesForCard(props: Props) {
  const libraries = useSuspenseQuery({
    queryKey: cardKeys.libraries(props.id),
    queryFn: () => getLibrariesForCard(props.id),
  });

  return libraries;
}
