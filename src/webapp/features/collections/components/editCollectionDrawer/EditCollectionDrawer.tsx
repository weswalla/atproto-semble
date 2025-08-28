import {
  Button,
  Container,
  Drawer,
  Group,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import useUpdateCollection from '../../lib/mutations/useUpdateCollection';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  collection: {
    id: string;
    name: string;
    description?: string;
  };
}

export default function EditCollectionDrawer(props: Props) {
  const updateCollection = useUpdateCollection();

  const form = useForm({
    initialValues: {
      name: props.collection.name,
      description: props.collection.description,
    },
  });

  const handleUpdateCollection = (e: React.FormEvent) => {
    e.preventDefault();

    updateCollection.mutate(
      {
        collectionId: props.collection.id,
        name: form.values.name,
        description: form.values.description,
      },
      {
        onSuccess: () => {
          notifications.show({
            message: `Updated collection "${form.values.name}".`,
          });
        },
        onError: () => {
          notifications.show({
            message: 'Could not update collection.',
            position: 'top-center',
          });
        },
        onSettled: () => {
          props.onClose();
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
    >
      <Drawer.Header>
        <Drawer.Title fz="xl" fw={600} mx="auto">
          Edit Collection
        </Drawer.Title>
      </Drawer.Header>

      <Container size="sm">
        <form onSubmit={handleUpdateCollection}>
          <Stack>
            <TextInput
              id="name"
              label="Name"
              placeholder="Collection name"
              variant="filled"
              required
              maxLength={100}
              key={form.key('name')}
              {...form.getInputProps('name')}
            />

            <Textarea
              id="description"
              label="Description"
              placeholder="Describe what this collection is about"
              variant="filled"
              rows={8}
              maxLength={500}
              key={form.key('description')}
              {...form.getInputProps('description')}
            />

            <Group justify="space-between">
              <Button variant="outline" color="gray" onClick={props.onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={updateCollection.isPending}>
                Update
              </Button>
            </Group>
          </Stack>
        </form>
      </Container>
    </Drawer>
  );
}
