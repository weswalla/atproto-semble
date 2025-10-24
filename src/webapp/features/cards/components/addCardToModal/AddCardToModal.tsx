import type { UrlCard } from '@/api-client';
import { DEFAULT_OVERLAY_PROPS } from '@/styles/overlays';
import { Modal, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Suspense, useState } from 'react';
import CollectionSelectorError from '../../../collections/components/collectionSelector/Error.CollectionSelector';
import CardToBeAddedPreview from '../cardToBeAddedPreview/CardToBeAddedPreview';
import useGetCardFromMyLibrary from '../../lib/queries/useGetCardFromMyLibrary';
import useMyCollections from '../../../collections/lib/queries/useMyCollections';
import CollectionSelector from '@/features/collections/components/collectionSelector/CollectionSelector';
import useUpdateCardAssociations from '../../lib/mutations/useUpdateCardAssociations';
import CollectionSelectorSkeleton from '@/features/collections/components/collectionSelector/Skeleton.CollectionSelector';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cardContent: UrlCard['cardContent'];
  cardId: string;
  note?: string;
}

export default function AddCardToModal(props: Props) {
  const cardStatus = useGetCardFromMyLibrary({ url: props.cardContent.url });
  const [note, setNote] = useState(props.note || '');
  const { data, error } = useMyCollections();

  const allCollections =
    data?.pages.flatMap((page) => page.collections ?? []) ?? [];

  const collectionsWithCard = allCollections.filter((c) =>
    cardStatus.data.collections?.some((col) => col.id === c.id),
  );

  const [selectedCollections, setSelectedCollections] =
    useState<SelectableCollectionItem[]>(collectionsWithCard);

  const updateCardAssociations = useUpdateCardAssociations();

  const handleUpdateCard = (e: React.FormEvent) => {
    e.preventDefault();

    const addedCollections = selectedCollections.filter(
      (c) => !collectionsWithCard.some((original) => original.id === c.id),
    );

    const removedCollections = collectionsWithCard.filter(
      (c) => !selectedCollections.some((selected) => selected.id === c.id),
    );

    if (addedCollections.length === 0 && removedCollections.length === 0) {
      props.onClose();
      return;
    }

    updateCardAssociations.mutate(
      {
        cardId: props.cardId,
        note: note,
        addToCollectionIds: addedCollections.map((c) => c.id),
        removeFromCollectionIds: removedCollections.map((c) => c.id),
      },
      {
        onError: () => {
          notifications.show({
            message: 'Could not update card.',
          });
        },
        onSettled: () => {
          props.onClose();
        },
      },
    );
  };

  if (error) {
    return <CollectionSelectorError />;
  }

  return (
    <Modal
      opened={props.isOpen}
      onClose={() => {
        props.onClose();
        setSelectedCollections(collectionsWithCard);
      }}
      title="Add or Update Card"
      withCloseButton={false}
      overlayProps={DEFAULT_OVERLAY_PROPS}
      centered
      onClick={(e) => e.stopPropagation()}
    >
      <Stack justify="space-between">
        <CardToBeAddedPreview
          cardContent={props.cardContent}
          note={note}
          onUpdateNote={setNote}
        />

        <Suspense fallback={<CollectionSelectorSkeleton />}>
          <CollectionSelector
            isOpen={true}
            onClose={props.onClose}
            onCancel={() => {
              props.onClose();
              setSelectedCollections(collectionsWithCard);
            }}
            onSave={handleUpdateCard}
            selectedCollections={selectedCollections}
            onSelectedCollectionsChange={setSelectedCollections}
          />
        </Suspense>
      </Stack>
    </Modal>
  );
}
