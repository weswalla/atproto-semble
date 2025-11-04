import { useSuspenseQuery } from '@tanstack/react-query';
import { getUrlCardView } from '../dal';
import { cardKeys } from '../cardKeys';

interface Props {
  id: string;
}

export default function useGetCard(props: Props) {
  const card = useSuspenseQuery({
    queryKey: cardKeys.card(props.id),
    queryFn: () => getUrlCardView(props.id),
  });

  return card;
}
