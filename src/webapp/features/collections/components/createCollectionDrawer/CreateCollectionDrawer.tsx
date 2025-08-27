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
import useCreateCollection from '../../lib/mutations/useCreateCollection';
import { notifications } from '@mantine/notifications';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function createCollectionDrawer(props: Props) {
  const createCollection = useCreateCollection();
  const form = useForm({
    initialValues: {
      name: '',
      description: '',
    },
  });

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();

    createCollection.mutate(
      {
        name: form.getValues().name,
        description: form.getValues().description,
      },
      {
        onSuccess: () => {
          notifications.show({
            message: `Created collection "${form.getValues().name}"`,
          });
          props.onClose();
        },
        onError: () => {
          notifications.show({
            message: 'Could not create collection.',
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
    >
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title fz={'xl'} fw={600} mx={'auto'}>
            Create Collection
          </Drawer.Title>
        </Drawer.Header>

        <Container size={'sm'}>
          <form onSubmit={handleCreateCollection}>
            <Stack>
              <TextInput
                id="name"
                label="Name"
                type="text"
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
                <Button
                  variant="outline"
                  color={'gray'}
                  onClick={props.onClose}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={createCollection.isPending}>
                  Create
                </Button>
              </Group>
            </Stack>
          </form>
        </Container>
      </Drawer.Content>
    </Drawer>
  );
}
