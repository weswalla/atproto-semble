import type { UrlCard, User } from '@/api-client';
import { getDomain } from '@/lib/utils/link';
import { UPDATE_OVERLAY_PROPS } from '@/styles/overlays';
import { Modal, Text } from '@mantine/core';
import NoteCardModalContent from './NoteCardModalContent';
import { Suspense } from 'react';
import NoteCardModalContentSkeleton from './Skeleton.NoteCardModalContent';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  note: UrlCard['note'];
  cardContent: UrlCard['cardContent'];
  cardAuthor?: User;
}

export default function NoteCardModal(props: Props) {
  const domain = getDomain(props.cardContent.url);

  return (
    <Modal
      opened={props.isOpen}
      onClose={props.onClose}
      title={<Text fw={600}>Note</Text>}
      overlayProps={UPDATE_OVERLAY_PROPS}
      centered
      onClick={(e) => e.stopPropagation()}
    >
      <Suspense fallback={<NoteCardModalContentSkeleton />}>
        <NoteCardModalContent {...props} domain={domain} />
      </Suspense>
    </Modal>
  );
}
