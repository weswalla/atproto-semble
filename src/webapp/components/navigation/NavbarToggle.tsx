'use client';

import { useNavbarContext } from '@/providers/navbar';
import { ActionIcon } from '@mantine/core';
import { FiSidebar } from 'react-icons/fi';

export default function NavbarToggle() {
  const { toggle } = useNavbarContext();

  return (
    <ActionIcon variant="light" color="gray" size={'lg'} onClick={toggle}>
      <FiSidebar />
    </ActionIcon>
  );
}
