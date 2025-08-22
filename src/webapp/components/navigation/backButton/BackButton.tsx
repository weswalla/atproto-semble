'use client';

import { useRouter } from 'next/navigation';
import { ActionIcon } from '@mantine/core';
import { BiSolidLeftArrowAlt } from 'react-icons/bi';

export default function BackButton() {
  const router = useRouter();

  return (
    <ActionIcon
      variant="light"
      color="gray"
      size={'lg'}
      radius={'xl'}
      onClick={() => router.back()}
    >
      <BiSolidLeftArrowAlt />
    </ActionIcon>
  );
}
