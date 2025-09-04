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
  Group,
} from '@mantine/core';
import { Fragment, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import useCollections from '../../lib/queries/useCollections';
import useCollectionSearch from '../../lib/queries/useCollectionSearch';
import CreateCollectionDrawer from '../createCollectionDrawer/CreateCollectionDrawer';
import CollectionSelectorError from './Error.CollectionSelector';
import CollectionSelectorItem from '../collectionSelectorItem/CollectionSelectorItem';
import { BiPlus } from 'react-icons/bi';
import { IoSearch } from 'react-icons/io5';
import { DEFAULT_OVERLAY_PROPS } from '@/styles/overlays';

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
  const hasSelectedCollections = props.selectedCollections.length > 0;

  return (
    <Fragment>
      <Drawer
        opened={props.isOpen}
        onClose={props.onClose}
        withCloseButton={false}
        position="bottom"
        size={'40rem'}
        overlayProps={DEFAULT_OVERLAY_PROPS}
      >
        <Drawer.Header>
          <Drawer.Title fz={'xl'} fw={600} mx={'auto'}>
            Add to collections
          </Drawer.Title>
        </Drawer.Header>
        <Container size={'xs'}>
          <Stack gap={'xl'}>
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

              {/* collections Panel */}
              <Tabs.Panel value="collections" my="xs" w="100%">
                <ScrollArea h={340} type="auto">
                  <Stack gap="xs">
                    {search ? (
                      <Fragment>
                        <Button
                          variant="light"
                          size="md"
                          color={'grape'}
                          radius={'lg'}
                          leftSection={<BiPlus size={22} />}
                          onClick={() => setIsDrawerOpen(true)}
                        >
                          Create new collection "{search}"
                        </Button>

                        {searchedCollections.isPending && (
                          <Stack align="center">
                            <Text fw={500} c="gray">
                              Searching collections...
                            </Text>
                            <Loader color="gray" />
                          </Stack>
                        )}

                        {searchedCollections.data &&
                          (searchedCollections.data.collections.length === 0 ? (
                            <Alert
                              color="gray"
                              title={`No results found for "${search}"`}
                            />
                          ) : (
                            renderCollectionItems(
                              searchedCollections.data.collections,
                            )
                          ))}
                      </Fragment>
                    ) : hasCollections ? (
                      renderCollectionItems(data.collections)
                    ) : (
                      <Stack align="center" gap="xs">
                        <Text fz="lg" fw={600} c="gray">
                          No collections
                        </Text>
                        <Button
                          onClick={() => setIsDrawerOpen(true)}
                          variant="light"
                          color="gray"
                          rightSection={<BiPlus size={22} />}
                        >
                          Create a collection
                        </Button>
                      </Stack>
                    )}
                  </Stack>
                </ScrollArea>
              </Tabs.Panel>

              {/* selected Collections Panel */}
              <Tabs.Panel value="selected" my="xs">
                <ScrollArea h={340} type="auto">
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
            <Group justify="space-between" gap={'xs'} grow>
              <Button
                variant="light"
                color={'gray'}
                size="md"
                onClick={() => {
                  props.onSelectedCollectionsChange([]);
                  props.onClose();
                }}
              >
                Cancel
              </Button>
              {hasSelectedCollections && (
                <Button
                  variant="light"
                  color="grape"
                  size="md"
                  onClick={() => props.onSelectedCollectionsChange([])}
                >
                  Clear all
                </Button>
              )}
              <Button size="md" onClick={props.onClose}>
                Save
              </Button>
            </Group>
          </Stack>
        </Container>
      </Drawer>
      <CreateCollectionDrawer
        key={search}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        initialName={search}
        onCreate={(newCollection) => {
          props.onSelectedCollectionsChange([
            ...props.selectedCollections,
            newCollection,
          ]);
        }}
      />
    </Fragment>
  );
}
