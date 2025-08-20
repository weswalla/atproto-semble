import { Alert, Button, NavLink, Skeleton } from '@mantine/core';
import Link from 'next/link';
import { BiRightArrowAlt } from 'react-icons/bi';
import useCollections from '../../lib/queries/useCollections';
import CollectionNavItem from '../collectionNavItem/CollectionNavItem';

export default function CollectionsNavList() {
  const { data, error, isPending } = useCollections();

  if (isPending || !data) {
    return <Skeleton h={40} w={'100%'} />;
  }

  if (error) {
    return <Alert color="red" title="Could not load collections" />;
  }

  return (
    <NavLink variant="subtle" c="gray" label="Collections">
      {data.collections.map((c) => (
        <CollectionNavItem
          key={c.id}
          name={c.name}
          url={`/collections/${c.id}`}
        />
      ))}
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
    </NavLink>
  );
}
