import { useContextDrawers } from '@/providers/drawers';
import { NavLink } from '@mantine/core';
import { BiPlus } from 'react-icons/bi';

export default function CreateCollectionShortcut() {
  const drawers = useContextDrawers();

  return (
    <NavLink
      component="button"
      label={'Create'}
      variant="subtle"
      c="blue"
      leftSection={<BiPlus size={25} />}
      onClick={() => drawers.open('createCollection')}
    />
  );
}
