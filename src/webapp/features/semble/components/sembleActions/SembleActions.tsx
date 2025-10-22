'use client';

import { Button, Group } from '@mantine/core';
import { FiPlus } from 'react-icons/fi';

export default function SembleActions() {
  return (
    <Group>
      <Button size="md" radius={'md'} leftSection={<FiPlus size={22} />}>
        Add
      </Button>
    </Group>
  );
}
