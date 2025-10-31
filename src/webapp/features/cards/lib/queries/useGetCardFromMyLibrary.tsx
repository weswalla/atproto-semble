import { useSuspenseQuery } from '@tanstack/react-query';
import { getCardFromMyLibrary } from '../dal';
import { cardKeys } from '../cardKeys';

interface Props {
  url: string;
}

export default function useGetCardFromMyLibrary(props: Props) {
  try {
    const cardStatus = useSuspenseQuery({
      queryKey: cardKeys.byUrl(props.url),
      queryFn: () => getCardFromMyLibrary(props.url),
    });
    return cardStatus;
  } catch (error) {
    // Return a default structure to indicate no card or error
    return { data: { card: null }, error: true };
  }
}
