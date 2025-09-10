import { UrlCardView } from '@/api-client/types';
import useCollectionSearch from '../../lib/queries/useCollectionSearch';
import { getDomain } from '@/lib/utils/link';
import { DEFAULT_OVERLAY_PROPS } from '@/styles/overlays';
import {
  AspectRatio,
  Group,
  Modal,
  Stack,
  Text,
  Image,
  TextInput,
  CloseButton,
  Tabs,
  ScrollArea,
  Button,
  Loader,
  Alert,
  Anchor,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { Fragment, useState } from 'react';
import { IoSearch } from 'react-icons/io5';
import { BiPlus } from 'react-icons/bi';
import CollectionSelectorItem from '../collectionSelectorItem/CollectionSelectorItem';
import useCollections from '../../lib/queries/useCollections';
import CollectionSelectorError from '../collectionSelector/Error.CollectionSelector';
import useCard from '@/features/cards/lib/queries/useGetCard';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cardContent: UrlCardView['cardContent'];
  cardId: string;
}

export default function AddToCollectionModal(props: Props) {
  const domain = getDomain(props.cardContent.url);

  const [search, setSearch] = useState<string>('');
  const [debouncedSearch] = useDebouncedValue(search, 200);
  const searchedCollections = useCollectionSearch({ query: debouncedSearch });

  const { user } = useAuth();
  const card = useCard({ id: props.cardId });
  const { data, error } = useCollections();
  const [selectedCollections, setSelectedCollections] = useState<
    { id: string; name: string; cardCount: number }[]
  >([]);

  const handleCollectionChange = (
    checked: boolean,
    item: { id: string; name: string; cardCount: number },
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

  const renderCollectionItems = (
    collections: { id: string; name: string; cardCount: number }[],
  ) => {
    return availableCollections.map((c) => (
      <CollectionSelectorItem
        key={c.id}
        name={c.name}
        cardCount={c.cardCount}
        value={c.id}
        checked={!!selectedCollections.find((col) => col.id === c.id)}
        onChange={handleCollectionChange}
      />
    ));
  };

  const allCollections =
    data?.pages.flatMap((page) => page.collections ?? []) ?? [];

  const collectionsWithCard = allCollections.filter((c) =>
    card.data?.collections.some((col) => col.id === c.id),
  );

  const availableCollections = allCollections.filter(
    (c) => !collectionsWithCard.some((col) => col.id === c.id),
  );

  const hasCollections = allCollections.length > 0;
  const hasSelectedCollections = selectedCollections.length > 0;

  if (error) {
    return <CollectionSelectorError />;
  }

  return (
    <Modal
      opened={props.isOpen}
      onClose={props.onClose}
      title="Add to Collections"
      size={'md'}
      overlayProps={DEFAULT_OVERLAY_PROPS}
      centered
    >
      <Stack gap={'xl'}>
        <Stack gap={'md'}>
          <Group gap={'sm'}>
            {props.cardContent.thumbnailUrl && (
              <AspectRatio ratio={1 / 1} flex={0.1}>
                <Image
                  src={props.cardContent.thumbnailUrl}
                  alt={`${props.cardContent.url} social preview image`}
                  radius={'md'}
                  w={50}
                  h={50}
                />
              </AspectRatio>
            )}
            <Stack gap={0} flex={0.9}>
              <Text c={'gray'} lineClamp={1}>
                {domain}
              </Text>
              {props.cardContent.title && (
                <Text fw={500} lineClamp={1}>
                  {props.cardContent.title}
                </Text>
              )}
            </Stack>
          </Group>
          {collectionsWithCard.length > 0 && (
            <Text fw={500} c={'gray'}>
              Already in {collectionsWithCard.length} collection{' '}
              {collectionsWithCard.length !== 1 && 's'}:{' '}
              {collectionsWithCard.map((col) => (
                <Anchor
                  key={col.id}
                  component={Link}
                  href={`/collections/${col.id}`}
                  c="blue"
                  fw={500}
                >
                  {col.name}
                </Anchor>
              ))}
            </Text>
          )}
        </Stack>

        <Stack gap={'md'}>
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
          <Stack gap={'xl'}>
            <Tabs defaultValue="collections">
              <Tabs.List grow>
                <Tabs.Tab value="collections">Collections</Tabs.Tab>
                <Tabs.Tab value="selected">
                  Selected ({selectedCollections.length})
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="collections" my="xs" w="100%">
                <ScrollArea type="auto">
                  <Stack gap="xs">
                    {search ? (
                      <Fragment>
                        <Button
                          variant="light"
                          size="md"
                          color="grape"
                          radius="lg"
                          leftSection={<BiPlus size={22} />}
                          // onClick={() => setIsDrawerOpen(true)}
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
                      renderCollectionItems(allCollections)
                    ) : (
                      <Stack align="center" gap="xs">
                        <Text fz="lg" fw={600} c="gray">
                          No collections
                        </Text>
                        <Button
                          // onClick={() => setIsDrawerOpen(true)}
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

              <Tabs.Panel value="selected" my="xs">
                <ScrollArea type="auto">
                  <Stack gap="xs">
                    {hasSelectedCollections ? (
                      renderCollectionItems(selectedCollections)
                    ) : (
                      <Alert color="gray" title="No collections selected" />
                    )}
                  </Stack>
                </ScrollArea>
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
                onClick={props.onClose}
                disabled={selectedCollections.length === 0}
              >
                Save
              </Button>
            </Group>
          </Stack>
        </Stack>
      </Stack>
    </Modal>
  );
}
