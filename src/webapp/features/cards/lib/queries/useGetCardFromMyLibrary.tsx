import { useSuspenseQuery } from '@tanstack/react-query';
import { getCardFromMyLibrary } from '../dal';

interface Props {
  url: string;
}

export default function useGetCardFromMyLibrary(props: Props) {
  const cardStatus = useSuspenseQuery({
    queryKey: ['card from my library', props.url],
    queryFn: () => getCardFromMyLibrary(props.url),
  });

  return cardStatus;
}
