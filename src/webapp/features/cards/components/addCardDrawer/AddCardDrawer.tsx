import {
  Button,
  Container,
  Drawer,
  Text,
  Group,
  Stack,
  Textarea,
  TextInput,
  Anchor,
} from '@mantine/core';
import { useForm } from '@mantine/form';

import { notifications } from '@mantine/notifications';
import useAddCard from '../../lib/mutations/useAddCard';
import CollectionSelector from '@/features/collections/components/collectionSelector/CollectionSelector';
import { Fragment, Suspense, useState } from 'react';
import CollectionSelectorSkeleton from '@/features/collections/components/collectionSelector/Skeleton.CollectionSelector';
import { IoMdLink } from 'react-icons/io';
import { useDisclosure } from '@mantine/hooks';
import { BiCollection } from 'react-icons/bi';
import Link from 'next/link';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedCollection?: { id: string; name: string; cardCount: number };
}

export default function AddCardDrawer(props: Props) {
  const [collectionSelectorOpened, { toggle: toggleCollectionSelector }] =
    useDisclosure(false);
  const initialCollections = props.selectedCollection
    ? [props.selectedCollection]
    : [];
  const [selectedCollections, setSelectedCollections] =
    useState<{ id: string; name: string; cardCount: number }[]>(
      initialCollections,
    );
  const addCard = useAddCard();

  const form = useForm({
    initialValues: {
      url: '',
      note: '',
      collections: initialCollections,
    },
  });

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();

    addCard.mutate(
      {
        url: form.getValues().url,
        note: form.getValues().note,
        collectionIds: selectedCollections.map((c) => c.id),
      },
      {
        onSuccess: () => {
          notifications.show({
            message: 'Added card.',
          });
          props.onClose();
        },
        onError: () => {
          notifications.show({
            message: 'Could not add card.',
          });
        },
        onSettled: () => {
          form.reset();
        },
      },
    );
  };

  return (
    <Drawer
      opened={props.isOpen}
      onClose={() => {
        props.onClose();
        setSelectedCollections([]);
      }}
      withCloseButton={false}
      position="bottom"
      size={'lg'}
      overlayProps={{
        blur: 3,
        gradient:
          'linear-gradient(0deg, rgba(204, 255, 0, 0.5), rgba(255, 255, 255, 0.5))',
      }}
    >
      <Drawer.Header>
        <Drawer.Title fz={'xl'} fw={600} mx={'auto'}>
          New Card
        </Drawer.Title>
      </Drawer.Header>
      <Container size={'sm'}>
        <form onSubmit={handleCreateCollection}>
          <Stack>
            <Stack>
              <Stack>
                <TextInput
                  id="url"
                  label="URL"
                  type="url"
                  placeholder="https://www.example.com"
                  variant="filled"
                  required
                  size="md"
                  leftSection={<IoMdLink size={22} />}
                  key={form.key('url')}
                  {...form.getInputProps('url')}
                />

                <Textarea
                  id="note"
                  label="Note"
                  placeholder="Add a note about this card"
                  variant="filled"
                  size="md"
                  rows={3}
                  maxLength={500}
                  key={form.key('note')}
                  {...form.getInputProps('note')}
                />
              </Stack>

              <Group>
                <Stack align="start" gap={'xs'}>
                  <Button
                    onClick={toggleCollectionSelector}
                    variant="light"
                    color="gray"
                    leftSection={<BiCollection size={22} />}
                  >
                    Add to collections
                  </Button>
                  {selectedCollections.length > 0 && (
                    <Text fw={500}>
                      Selected collections:{' '}
                      <Text fw={500} span>
                        {selectedCollections.map((c, index) => (
                          <Fragment key={c.id}>
                            <Anchor
                              component={Link}
                              href={`/collections/${c.id}`}
                              target="_blank"
                              c="blue"
                            >
                              {c.name}
                            </Anchor>
                            {index < selectedCollections.length - 1 && ', '}
                          </Fragment>
                        ))}
                      </Text>
                    </Text>
                  )}
                </Stack>
              </Group>
              <Suspense fallback={<CollectionSelectorSkeleton />}>
                <CollectionSelector
                  isOpen={collectionSelectorOpened}
                  onClose={toggleCollectionSelector}
                  selectedCollections={selectedCollections}
                  onSelectedCollectionsChange={setSelectedCollections}
                />
              </Suspense>
            </Stack>
            <Group justify="space-between">
              <Button variant="outline" color={'gray'} onClick={props.onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={addCard.isPending}>
                Add card
              </Button>
            </Group>
          </Stack>
        </form>
      </Container>
    </Drawer>
  );
}
