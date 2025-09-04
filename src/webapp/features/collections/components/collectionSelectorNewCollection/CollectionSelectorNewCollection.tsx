import { useContextDrawers } from '@/providers/drawers';
import { Button } from '@mantine/core';
import { BiPlus } from 'react-icons/bi';

interface Props {
  name: string;
}

export default function CollectionSelectorNewCollection(props: Props) {
  const drawers = useContextDrawers();

  return (
    <Button
      variant="light"
      size="md"
      color={'grape'}
      radius={'lg'}
      leftSection={<BiPlus size={22} />}
      onClick={() => drawers.open('createCollection')}
    >
      Create new collection "{props.name}"
    </Button>
  );
}
