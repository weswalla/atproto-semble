import Link from 'next/link';
import { Alert, Button, NavLink, Skeleton } from '@mantine/core';
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
      <Button
        component={Link}
        href="/collections"
        variant="subtle"
        size="md"
        color="gray"
        justify="start"
        radius={'md'}
        leftSection={<BiRightArrowAlt size={25} />}
        fullWidth
      >
        View all
      </Button>
      <Button
        component={Link}
        href="/collections/create"
        variant="subtle"
        size="md"
        color="gray"
        justify="start"
        radius={'md'}
        leftSection={<BiPlus size={25} />}
        fullWidth
      >
        Add
      </Button>
      {data.collections.map((c) => (
        <CollectionNavItem
          key={c.id}
          name={c.name}
          url={`/collections/${c.id}`}
        />
      ))}
    </NavLink>
  );
}
