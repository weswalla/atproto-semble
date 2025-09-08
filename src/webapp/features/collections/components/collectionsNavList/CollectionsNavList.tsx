import Link from 'next/link';
import { NavLink, Stack } from '@mantine/core';
import { BiCollection, BiRightArrowAlt } from 'react-icons/bi';
import CollectionNavItem from '../collectionNavItem/CollectionNavItem';
import useCollections from '../../lib/queries/useCollections';
import { useToggle } from '@mantine/hooks';
import CollectionsNavListError from './Error.CollectionsNavList';
import CreateCollectionShortcut from '../createCollectionShortcut/CreateCollectionShortcut';

export default function CollectionsNavList() {
  const { data, error } = useCollections({ limit: 30 });
  const [opened, toggleMenu] = useToggle([true, false]);

  if (error) {
    return <CollectionsNavListError />;
  }

  const collections =
    data?.pages.flatMap((page) => page.collections ?? []) ?? [];

  return (
    <NavLink
      variant="subtle"
      c="gray"
      label="Collections"
      leftSection={<BiCollection size={22} />}
      opened={opened}
      onClick={() => toggleMenu()}
    >
      <CreateCollectionShortcut />

      <NavLink
        component={Link}
        href="/collections"
        label="View all"
        variant="subtle"
        c="blue"
        leftSection={<BiRightArrowAlt size={25} />}
      />

      <Stack gap={0}>
        {collections.map((collection) => (
          <CollectionNavItem
            key={collection.id}
            name={collection.name}
            url={`/collections/${collection.id}`}
            cardCount={collection.cardCount}
          />
        ))}
      </Stack>
    </NavLink>
  );
}
