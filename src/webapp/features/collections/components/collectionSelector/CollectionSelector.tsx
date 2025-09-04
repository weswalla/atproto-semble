import {
  ScrollArea,
  Stack,
  Tabs,
  TextInput,
  Text,
  Alert,
  Loader,
  CloseButton,
  Button,
  Drawer,
  Container,
  SimpleGrid,
  Group,
} from '@mantine/core';
import { IoSearch } from 'react-icons/io5';
import { useState } from 'react';
import useCollections from '../../lib/queries/useCollections';
import useCollectionSearch from '../../lib/queries/useCollectionSearch';
import { useDebouncedValue } from '@mantine/hooks';

import CollectionSelectorError from './Error.CollectionSelector';
import CollectionSelectorItem from '../collectionSelectorItem/CollectionSelectorItem';
import CollectionSelectorNewCollection from '../collectionSelectorNewCollection/CollectionSelectorNewCollection';
import { BiPlus } from 'react-icons/bi';
import { useContextDrawers } from '@/providers/drawers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedCollections: { id: string; name: string; cardCount: number }[];
  onSelectedCollectionsChange: (
    collectionIds: { id: string; name: string; cardCount: number }[],
  ) => void;
}

export default function CollectionSelector(props: Props) {
  const { data, error } = useCollections();
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch] = useDebouncedValue(search, 200);
  const searchedCollections = useCollectionSearch({ query: debouncedSearch });
  const drawers = useContextDrawers();

  const handleCollectionChange = (
    checked: boolean,
    item: { id: string; name: string; cardCount: number },
  ) => {
    if (checked) {
      if (!props.selectedCollections.some((col) => col.id === item.id)) {
        props.onSelectedCollectionsChange([...props.selectedCollections, item]);
      }
    } else {
      props.onSelectedCollectionsChange(
        props.selectedCollections.filter((col) => col.id !== item.id),
      );
    }
  };

  const renderCollectionItems = (
    collections: { id: string; name: string; cardCount: number }[],
  ) => {
    return collections.map((c) => (
      <CollectionSelectorItem
        key={c.id}
        name={c.name}
        cardCount={c.cardCount}
        value={c.id}
        checked={!!props.selectedCollections.find((col) => col.id === c.id)}
        onChange={handleCollectionChange}
      />
    ));
  };

  if (error) {
    return <CollectionSelectorError />;
  }

  const hasCollections = data?.collections?.length > 0;

  return (
    <Drawer
      opened={props.isOpen}
      onClose={props.onClose}
      withCloseButton={false}
      position="bottom"
      size={'33rem'}
      overlayProps={{
        blur: 3,
        gradient:
          'linear-gradient(0deg, rgba(204, 255, 0, 0.5), rgba(255, 255, 255, 0.5))',
      }}
    >
      <Drawer.Header>
        <Drawer.Title fz={'xl'} fw={600} mx={'auto'}>
          Add to collections
        </Drawer.Title>
      </Drawer.Header>
      <Container size={'sm'}>
        <Stack>
          <TextInput
            placeholder="Search for collections"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            size="md"
            variant="filled"
            id="search"
            leftSection={<IoSearch size={22} />}
            rightSection={
              <CloseButton
                aria-label="Clear input"
                onClick={() => setSearch('')}
                style={{ display: search ? undefined : 'none' }}
              />
            }
          />
          <Tabs defaultValue="collections">
            <Tabs.List grow>
              <Tabs.Tab value="collections">Collections</Tabs.Tab>
              <Tabs.Tab value="selected">
                Selected ({props.selectedCollections.length})
              </Tabs.Tab>
            </Tabs.List>

            {/* Collections Panel */}
            <Tabs.Panel value="collections" my="xs" w="100%">
              <ScrollArea h={245}>
                <Stack gap="xs">
                  {search && <CollectionSelectorNewCollection name={search} />}
                  {search && searchedCollections.isPending && (
                    <Stack align="center">
                      <Text fw={500} c="gray">
                        Searching collections...
                      </Text>
                      <Loader color="gray" />
                    </Stack>
                  )}
                  {search &&
                    searchedCollections.data &&
                    searchedCollections.data.collections.length === 0 && (
                      <Alert
                        color="gray"
                        title={`No results found for "${search}"`}
                      />
                    )}
                  {search &&
                    searchedCollections.data &&
                    renderCollectionItems(searchedCollections.data.collections)}
                  {!search && !hasCollections && (
                    <Stack align="center" gap={'xs'}>
                      <Text fz={'lg'} fw={600} c={'gray'}>
                        No collections
                      </Text>
                      <Button
                        onClick={() => drawers.open('createCollection')}
                        variant="light"
                        color={'gray'}
                        rightSection={<BiPlus size={22} />}
                      >
                        Create a collection
                      </Button>
                    </Stack>
                  )}
                  {!search &&
                    hasCollections &&
                    renderCollectionItems(data.collections)}
                </Stack>
              </ScrollArea>
            </Tabs.Panel>

            {/* Selected Collections Panel */}
            <Tabs.Panel value="selected" my="xs">
              <ScrollArea h={245}>
                <Stack gap="xs">
                  {props.selectedCollections.length > 0 ? (
                    renderCollectionItems(props.selectedCollections)
                  ) : (
                    <Alert color="gray" title="No collections selected" />
                  )}
                </Stack>
              </ScrollArea>
            </Tabs.Panel>
          </Tabs>
          <Group justify="space-between">
            <Button
              variant="outline"
              color={'gray'}
              onClick={() => {
                props.onSelectedCollectionsChange([]);
                props.onClose();
              }}
            >
              Cancel
            </Button>
            <Button onClick={props.onClose}>Save</Button>
          </Group>
        </Stack>
      </Container>
    </Drawer>
  );
}
