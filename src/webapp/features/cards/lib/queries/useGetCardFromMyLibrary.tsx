import { useSuspenseQuery } from '@tanstack/react-query';
import { getCardFromMyLibrary } from '../dal';
import { cardKeys } from '../cardKeys';

interface Props {
  url: string;
}

export default function useGetCardFromMyLibrary(props: Props) {
  const cardStatus = useSuspenseQuery({
    queryKey: cardKeys.all(),
    queryFn: () => getCardFromMyLibrary(props.url),
  });

  return cardStatus;
}
