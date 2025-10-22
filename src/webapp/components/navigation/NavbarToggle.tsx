'use client';

import { useNavbarContext } from '@/providers/navbar';
import { ActionIcon } from '@mantine/core';
import { Fragment } from 'react';
import { FiSidebar } from 'react-icons/fi';

export default function NavbarToggle() {
  const { toggleMobile, toggleDesktop } = useNavbarContext();

  return (
    <Fragment>
      <ActionIcon
        variant="light"
        color="gray"
        size={'lg'}
        onClick={toggleMobile}
        hiddenFrom="xs"
      >
        <FiSidebar />
      </ActionIcon>
      <ActionIcon
        variant="light"
        color="gray"
        size={'lg'}
        onClick={toggleDesktop}
        visibleFrom="xs"
      >
        <FiSidebar />
      </ActionIcon>
    </Fragment>
  );
}
