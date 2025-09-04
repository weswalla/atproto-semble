import { NavLink } from '@mantine/core';
import { Fragment, useState } from 'react';
import { BiPlus } from 'react-icons/bi';
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
        leftSection={<BiPlus size={25} />}
        onClick={() => setIsDrawerOpen(true)}
      />
      <CreateCollectionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </Fragment>
  );
}
