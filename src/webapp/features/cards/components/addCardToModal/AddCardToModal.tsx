import type { UrlCard } from '@/api-client';
import { DEFAULT_OVERLAY_PROPS } from '@/styles/overlays';
import { Modal, Stack, Text } from '@mantine/core';
import { Suspense } from 'react';
import CollectionSelectorSkeleton from '@/features/collections/components/collectionSelector/Skeleton.CollectionSelector';
import AddCardToModalContent from './AddCardToModalContent'; // new file or inline

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cardContent: UrlCard['cardContent'];
  urlLibraryCount: number;
  cardId: string;
  note?: string;
  isInYourLibrary: boolean;
}

export default function AddCardToModal(props: Props) {
  return (
    <Modal
      opened={props.isOpen}
      onClose={props.onClose}
      title={
        <Stack gap={0}>
          <Text fw={600}>Add or update card</Text>
          <Text c="gray" fw={500}>
            {props.isInYourLibrary
              ? props.urlLibraryCount === 1
                ? 'Saved by you'
                : `Saved by you and ${props.urlLibraryCount - 1} other${props.urlLibraryCount - 1 > 1 ? 's' : ''}`
              : props.urlLibraryCount === 1
                ? 'Saved by 1 person'
                : `Saved by ${props.urlLibraryCount} people`}
          </Text>
        </Stack>
      }
      overlayProps={DEFAULT_OVERLAY_PROPS}
      centered
      onClick={(e) => e.stopPropagation()}
    >
      <Suspense fallback={<CollectionSelectorSkeleton />}>
        <AddCardToModalContent
          onClose={props.onClose}
          cardId={props.cardId}
          cardContent={props.cardContent}
          note={props.note}
        />
      </Suspense>
    </Modal>
  );
}
