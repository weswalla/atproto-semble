import {
  Button,
  Container,
  Drawer,
  Group,
  Stack,
  Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import useUpdateNote from '../../lib/mutations/useUpdateNote';
import { DEFAULT_OVERLAY_PROPS } from '@/styles/overlays';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  note: {
    cardId: string;
    text: string;
  };
}

export default function EditNoteDrawer(props: Props) {
  const updateNote = useUpdateNote();

  const form = useForm({
    initialValues: {
      text: props.note.text,
    },
  });

  const handleUpdateNote = (e: React.FormEvent) => {
    e.preventDefault();

    updateNote.mutate(
      {
        cardId: props.note.cardId,
        note: form.values.text,
      },
      {
        onSuccess: () => {
          notifications.show({
            message: 'Updated note',
          });
        },
        onError: () => {
          notifications.show({
            message: 'Could not update note.',
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
      size={'30rem'}
      overlayProps={DEFAULT_OVERLAY_PROPS}
    >
      <Drawer.Header>
        <Drawer.Title fz="xl" fw={600} mx="auto">
          Edit Note
        </Drawer.Title>
      </Drawer.Header>

      <Container size="sm">
        <form onSubmit={handleUpdateNote}>
          <Stack>
            <Textarea
              id="note"
              label="Note"
              placeholder="Add a note about this card"
              variant="filled"
              size="md"
              rows={3}
              maxLength={500}
              key={form.key('text')}
              {...form.getInputProps('text')}
            />

            <Group justify="space-between" gap={'xs'} grow>
              <Button
                variant="light"
                size="md"
                color="gray"
                onClick={props.onClose}
              >
                Cancel
              </Button>
              <Button type="submit" size="md" loading={updateNote.isPending}>
                Update
              </Button>
            </Group>
          </Stack>
        </form>
      </Container>
    </Drawer>
  );
}
