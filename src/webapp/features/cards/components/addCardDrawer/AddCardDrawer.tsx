import {
  Button,
  Container,
  Drawer,
  Grid,
  Group,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';

import { notifications } from '@mantine/notifications';
import useAddCard from '../../lib/mutations/useAddCard';
import CollectionSelector from '@/features/collections/components/collectionSelector/CollectionSelector';
import { Suspense, useState } from 'react';
import CollectionSelectorSkeleton from '@/features/collections/components/collectionSelector/Skeleton.CollectionSelector';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedCollection?: { id: string; name: string; description?: string };
}

export default function AddCardDrawer(props: Props) {
  const initialCollections = props.selectedCollection
    ? [props.selectedCollection]
    : [];
  const [selectedCollections, setSelectedCollections] =
    useState<{ id: string; name: string; description?: string }[]>(
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
      onClose={props.onClose}
      withCloseButton={false}
      position="bottom"
      overlayProps={{
        blur: 3,
        gradient:
          'linear-gradient(0deg, rgba(204, 255, 0, 0.5), rgba(255, 255, 255, 0.5))',
      }}
      size={'lg'}
    >
      <Drawer.Header>
        <Drawer.Title fz={'xl'} fw={600} mx={'auto'}>
          New Card
        </Drawer.Title>
      </Drawer.Header>
      <Container size={'sm'}>
        <form onSubmit={handleCreateCollection}>
          <Stack>
            <Grid gutter={'md'}>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Stack>
                  <TextInput
                    id="url"
                    label="URL"
                    type="url"
                    placeholder="https://www.example.com"
                    variant="filled"
                    required
                    key={form.key('url')}
                    {...form.getInputProps('url')}
                  />

                  <Textarea
                    id="note"
                    label="Note"
                    placeholder="Add a note about this card"
                    variant="filled"
                    rows={10}
                    maxLength={500}
                    key={form.key('note')}
                    {...form.getInputProps('note')}
                  />
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Suspense fallback={<CollectionSelectorSkeleton />}>
                  <CollectionSelector
                    selectedCollections={selectedCollections}
                    onSelectedCollectionsChange={setSelectedCollections}
                  />
                </Suspense>
              </Grid.Col>
            </Grid>
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
