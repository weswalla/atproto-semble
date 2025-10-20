import { UrlCardView } from '@/api-client/types';
import useCollectionSearch from '@/features/collections/lib/queries/useCollectionSearch';
import { DEFAULT_OVERLAY_PROPS } from '@/styles/overlays';
import {
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  CloseButton,
  Tabs,
  ScrollArea,
  Button,
  Loader,
  Alert,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { Fragment, useState } from 'react';
import { IoSearch } from 'react-icons/io5';
import { FiPlus } from 'react-icons/fi';
import CollectionSelectorError from '../../../collections/components/collectionSelector/Error.CollectionSelector';
import CollectionSelectorItemList from '../../../collections/components/collectionSelectorItemList/CollectionSelectorItemList';
import CreateCollectionDrawer from '../../../collections/components/createCollectionDrawer/CreateCollectionDrawer';
import CardToBeAddedPreview from './CardToBeAddedPreview';
import useAddCardToLibrary from '../../lib/mutations/useAddCardToLibrary';
import useGetCardFromMyLibrary from '../../lib/queries/useGetCardFromMyLibrary';
import useMyCollections from '../../../collections/lib/queries/useMyCollections';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cardContent: UrlCardView['cardContent'];
  cardId: string;
}

export default function AddCardToModal(props: Props) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [search, setSearch] = useState<string>('');
  const [debouncedSearch] = useDebouncedValue(search, 200);
  const searchedCollections = useCollectionSearch({ query: debouncedSearch });

  const addCardToLibrary = useAddCardToLibrary();

  const cardStaus = useGetCardFromMyLibrary({ url: props.cardContent.url });
  const { data, error } = useMyCollections();
  const [selectedCollections, setSelectedCollections] = useState<
    SelectableCollectionItem[]
  >([]);

  const handleCollectionChange = (
    checked: boolean,
    item: SelectableCollectionItem,
  ) => {
    if (checked) {
      if (!selectedCollections.some((col) => col.id === item.id)) {
        setSelectedCollections([...selectedCollections, item]);
      }
    } else {
      setSelectedCollections(
        selectedCollections.filter((col) => col.id !== item.id),
      );
    }
  };

  const allCollections =
    data?.pages.flatMap((page) => page.collections ?? []) ?? [];

  const collectionsWithCard = allCollections.filter((c) =>
    cardStaus.data.collections?.some((col) => col.id === c.id),
  );

  const collectionsWithoutCard = allCollections.filter(
    (c) => !collectionsWithCard.some((col) => col.id === c.id),
  );

  const isInUserLibrary = collectionsWithCard.length > 0;

  const hasCollections = allCollections.length > 0;
  const hasSelectedCollections = selectedCollections.length > 0;

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();

    addCardToLibrary.mutate(
      {
        url: props.cardContent.url,
        collectionIds: selectedCollections.map((c) => c.id),
      },
      {
        onSuccess: () => {
          setSelectedCollections([]);
          props.onClose();
        },
        onError: () => {
          notifications.show({
            message: 'Could not add card.',
          });
        },
        onSettled: () => {
          setSelectedCollections([]);
          props.onClose();
        },
      },
    );
  };

  if (error) {
    return <CollectionSelectorError />;
  }

  return (
    <Modal
      opened={props.isOpen}
      onClose={props.onClose}
      title="Add Card"
      overlayProps={DEFAULT_OVERLAY_PROPS}
      centered
      onClick={(e) => e.stopPropagation()}
    >
      <Stack gap={'xl'}>
        <CardToBeAddedPreview
          cardId={props.cardId}
          cardContent={props.cardContent}
          collectionsWithCard={collectionsWithCard}
          isInLibrary={isInUserLibrary}
        />

        <Stack gap={'md'}>
          <TextInput
            placeholder="Search for collections"
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
            }}
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
          <Stack gap={'xl'}>
            <Tabs defaultValue={'collections'}>
              <Tabs.List grow>
                <Tabs.Tab value="collections">Collections</Tabs.Tab>
                <Tabs.Tab value="selected">
                  Selected ({selectedCollections.length})
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="collections" my="xs" w="100%">
                <ScrollArea.Autosize mah={200} type="auto">
                  <Stack gap="xs">
                    {search ? (
                      <Fragment>
                        <Button
                          variant="light"
                          size="md"
                          color="grape"
                          radius="lg"
                          leftSection={<FiPlus size={22} />}
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
                            <CollectionSelectorItemList
                              collections={searchedCollections.data.collections}
                              collectionsWithCard={collectionsWithCard}
                              selectedCollections={selectedCollections}
                              onChange={handleCollectionChange}
                            />
                          ))}
                      </Fragment>
                    ) : hasCollections ? (
                      <Fragment>
                        <Button
                          variant="light"
                          size="md"
                          color="grape"
                          radius="lg"
                          leftSection={<FiPlus size={22} />}
                          onClick={() => setIsDrawerOpen(true)}
                        >
                          Create new collection
                        </Button>
                        <CollectionSelectorItemList
                          collections={collectionsWithoutCard}
                          selectedCollections={selectedCollections}
                          onChange={handleCollectionChange}
                        />
                      </Fragment>
                    ) : (
                      <Stack align="center" gap="xs">
                        <Text fz="lg" fw={600} c="gray">
                          No collections
                        </Text>
                        <Button
                          onClick={() => setIsDrawerOpen(true)}
                          variant="light"
                          color="gray"
                          rightSection={<FiPlus size={22} />}
                        >
                          Create a collection
                        </Button>
                      </Stack>
                    )}
                  </Stack>
                </ScrollArea.Autosize>
              </Tabs.Panel>

              <Tabs.Panel value="selected" my="xs">
                <ScrollArea.Autosize mah={200} type="auto">
                  <Stack gap="xs">
                    {hasSelectedCollections ? (
                      <CollectionSelectorItemList
                        collections={selectedCollections}
                        selectedCollections={selectedCollections}
                        onChange={handleCollectionChange}
                      />
                    ) : (
                      <Alert color="gray" title="No collections selected" />
                    )}
                  </Stack>
                </ScrollArea.Autosize>
              </Tabs.Panel>
            </Tabs>

            <Group justify="space-between" gap="xs" grow>
              <Button
                variant="light"
                color="gray"
                size="md"
                onClick={() => {
                  setSelectedCollections([]);
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
                  onClick={() => setSelectedCollections([])}
                >
                  Clear
                </Button>
              )}
              <Button
                size="md"
                onClick={handleAddCard}
                // disabled when:
                // user already has the card in a collection (and therefore in library)
                // and no new collection is selected yet
                disabled={isInUserLibrary && selectedCollections.length === 0}
                loading={addCardToLibrary.isPending}
              >
                Add
              </Button>
            </Group>
          </Stack>
        </Stack>
      </Stack>
      <CreateCollectionDrawer
        key={search}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        initialName={search}
        onCreate={(newCollection) => {
          setSelectedCollections([...selectedCollections, newCollection]);
        }}
      />
    </Modal>
  );
}
