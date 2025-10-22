import { NavLink } from '@mantine/core';
import { Fragment, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import CreateCollectionDrawer from '@/features/collections/components/createCollectionDrawer/CreateCollectionDrawer';

export default function CreateCollectionShortcut() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <Fragment>
      <NavLink
        component="button"
        label={'Create'}
        variant="subtle"
        c="blue"
        leftSection={<FiPlus size={25} />}
        onClick={() => setIsDrawerOpen(true)}
      />
      <CreateCollectionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </Fragment>
  );
}
