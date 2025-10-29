import { useSuspenseQuery } from '@tanstack/react-query';
import { getUrlCardView } from '../dal';

interface Props {
  id: string;
}

export default function useGetCard(props: Props) {
  const card = useSuspenseQuery({
    queryKey: ['card', props.id],
    queryFn: () => getUrlCardView(props.id),
  });

  return card;
}
