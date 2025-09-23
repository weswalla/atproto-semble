import { Button, Stack, Modal } from '@mantine/core';
import useDeleteCollection from '../../lib/mutations/useDeleteCollection';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { DANGER_OVERLAY_PROPS } from '@/styles/overlays';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
}

export default function DeleteCollectionModal(props: Props) {
  const deleteCollection = useDeleteCollection();
  const router = useRouter();

  const handleDeleteCollection = () => {
    deleteCollection.mutate(props.collectionId, {
      onSuccess: (fes) => {
        props.onClose();
        router.push('./');
      },
      onError: () => {
        notifications.show({
          message: 'Could not delete collection.',
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
      title="Delete Collection"
      size={'xs'}
      overlayProps={DANGER_OVERLAY_PROPS}
      centered
    >
      <Stack>
        <Button variant="subtle" size="md" color="gray" onClick={props.onClose}>
          Cancel
        </Button>
        <Button
          color="red"
          size="md"
          onClick={handleDeleteCollection}
          loading={deleteCollection.isPending}
        >
          Delete
        </Button>
      </Stack>
    </Modal>
  );
}
