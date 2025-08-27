import Link from 'next/link';
import { NavLink, Stack } from '@mantine/core';
import { BiCollection, BiRightArrowAlt } from 'react-icons/bi';
import CollectionNavItem from '../collectionNavItem/CollectionNavItem';
import useCollections from '../../lib/queries/useCollections';
import { useToggle } from '@mantine/hooks';
import CollectionsNavListError from './Error.CollectionsNavList';
import CreateCollectionShortcut from '../createCollectionShortcut/CreateCollectionShortcut';

export default function CollectionsNavList() {
  const { data, error } = useCollections();
  const [opened, toggleMenu] = useToggle([true, false]);

  if (error) {
    return <CollectionsNavListError />;
  }

  return (
    <NavLink
      variant="subtle"
      c="gray"
      label="Collections"
      leftSection={<BiCollection size={22} />}
      opened={opened}
      onClick={() => toggleMenu()}
    >
      {/* Self-contained shortcut to prevent won't re-render this whole list when interacted with */}
      <CreateCollectionShortcut />

      <NavLink
        component={Link}
        href="/collections"
        label={'View all'}
        variant="subtle"
        c="blue"
        leftSection={<BiRightArrowAlt size={25} />}
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
