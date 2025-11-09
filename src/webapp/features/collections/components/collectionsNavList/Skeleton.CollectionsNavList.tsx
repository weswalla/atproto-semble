import { NavLink, Skeleton, Stack } from '@mantine/core';
import { BiCollection } from 'react-icons/bi';

export default function CollectionsNavListSkeleton() {
  return (
    <NavLink
      variant="subtle"
      c="gray"
      label="Collections"
      leftSection={<BiCollection size={22} />}
      opened={true}
    >
      <Stack gap={5} my={'sm'}>
        <Skeleton h={40} w={'100%'} />
        <Skeleton h={40} w={'100%'} />
      </Stack>
    </NavLink>
  );
}
