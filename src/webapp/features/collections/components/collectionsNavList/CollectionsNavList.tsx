import Link from 'next/link';
import { Alert, NavLink, Skeleton, Stack } from '@mantine/core';
import { BiCollection, BiPlus, BiRightArrowAlt } from 'react-icons/bi';
import CollectionNavItem from '../collectionNavItem/CollectionNavItem';
import useCollections from '../../lib/queries/useCollections';

export default function CollectionsNavList() {
  const { data, error, isPending } = useCollections();

  if (isPending || !data) {
    return <Skeleton h={40} w={'100%'} />;
  }

  if (error) {
    return <Alert color="red" title="Could not load collections" />;
  }

  return (
    <NavLink
      variant="subtle"
      c="gray"
      label="Collections"
      leftSection={<BiCollection size={22} />}
    >
      <NavLink
        component={Link}
        href="/collections"
        label={'View all'}
        variant="subtle"
        c="gray"
        leftSection={<BiRightArrowAlt size={25} />}
      />

      <NavLink
        component={Link}
        href="/collections/create"
        label={'Add'}
        variant="subtle"
        c="gray"
        leftSection={<BiPlus size={25} />}
      />

      <Stack gap={0}>
        {data.collections.map((c) => (
          <CollectionNavItem
            key={c.id}
            name={c.name}
            url={`/collections/${c.id}`}
            cardCount={c.cardCount}
          />
        ))}
      </Stack>
    </NavLink>
  );
}
