import { Button, Stack, Modal } from '@mantine/core';
import useRemoveCardFromLibrary from '../../lib/mutations/useRemoveCardFromLibrary';
import { notifications } from '@mantine/notifications';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
}

export default function RemoveCardFromLibraryModal(props: Props) {
  const removeCardFromLibrary = useRemoveCardFromLibrary();

  const handleRemoveCardFromLibrary = () => {
    removeCardFromLibrary.mutate(props.cardId, {
      onError: () => {
        notifications.show({
          message: 'Could not remove card from library.',
          position: 'top-center',
        });
      },
      onSettled: () => {
        props.onClose();
      },
    });
  };

  return (
    <Modal
      opened={props.isOpen}
      onClose={props.onClose}
      withCloseButton={false}
      title="Remove card from library"
      size={'xs'}
      overlayProps={{ blur: 3 }}
      centered
    >
      <Stack>
        <Button variant="subtle" size="md" color="gray" onClick={props.onClose}>
          Cancel
        </Button>
        <Button
          color="red"
          size="md"
          onClick={handleRemoveCardFromLibrary}
          loading={removeCardFromLibrary.isPending}
        >
          Remove
        </Button>
      </Stack>
    </Modal>
  );
}
