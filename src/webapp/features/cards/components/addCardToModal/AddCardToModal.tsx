import type { UrlCard } from '@/api-client';
import { DEFAULT_OVERLAY_PROPS } from '@/styles/overlays';
import { Anchor, Modal, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Suspense, useState } from 'react';
import CollectionSelectorError from '../../../collections/components/collectionSelector/Error.CollectionSelector';
import CardToBeAddedPreview from '../cardToBeAddedPreview/CardToBeAddedPreview';
import useGetCardFromMyLibrary from '../../lib/queries/useGetCardFromMyLibrary';
import useMyCollections from '../../../collections/lib/queries/useMyCollections';
import CollectionSelector from '@/features/collections/components/collectionSelector/CollectionSelector';
import useUpdateCardAssociations from '../../lib/mutations/useUpdateCardAssociations';
import CollectionSelectorSkeleton from '@/features/collections/components/collectionSelector/Skeleton.CollectionSelector';
import useAddCard from '../../lib/mutations/useAddCard';

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
  const cardStatus = useGetCardFromMyLibrary({ url: props.cardContent.url });
  const [note, setNote] = useState(props.note);
  const { data, error } = useMyCollections();

  const allCollections =
    data?.pages.flatMap((page) => page.collections ?? []) ?? [];

  const collectionsWithCard = allCollections.filter((c) =>
    cardStatus.data.collections?.some((col) => col.id === c.id),
  );

  const [selectedCollections, setSelectedCollections] =
    useState<SelectableCollectionItem[]>(collectionsWithCard);

  const addCard = useAddCard();
  const updateCardAssociations = useUpdateCardAssociations();

  const handleUpdateCard = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedNote = note?.trimEnd() === '' ? undefined : note;

    const addedCollections = selectedCollections.filter(
      (c) => !collectionsWithCard.some((original) => original.id === c.id),
    );

    const removedCollections = collectionsWithCard.filter(
      (c) => !selectedCollections.some((selected) => selected.id === c.id),
    );

    const hasNoteChanged = trimmedNote !== props.note;
    const hasAdded = addedCollections.length > 0;
    const hasRemoved = removedCollections.length > 0;

    if (cardStatus.data.cardId && !hasNoteChanged && !hasAdded && !hasRemoved) {
      props.onClose();
      return;
    }

    // if the card is not in library, add it instead of updating
    if (!cardStatus.data.cardId) {
      addCard.mutate(
        {
          url: props.cardContent.url,
          note: trimmedNote,
          collectionIds: selectedCollections.map((c) => c.id),
        },
        {
          onError: () => {
            notifications.show({
              message: 'Could not add card.',
            });
          },
          onSettled: () => {
            props.onClose();
          },
        },
      );
      return;
    }

    // otherwise, update existing card associations
    const updatedCardPayload: {
      cardId: string;
      note?: string;
      addToCollectionIds?: string[];
      removeFromCollectionIds?: string[];
    } = { cardId: cardStatus.data.cardId };

    if (hasNoteChanged) updatedCardPayload.note = trimmedNote;
    if (hasAdded)
      updatedCardPayload.addToCollectionIds = addedCollections.map((c) => c.id);
    if (hasRemoved)
      updatedCardPayload.removeFromCollectionIds = removedCollections.map(
        (c) => c.id,
      );

    updateCardAssociations.mutate(updatedCardPayload, {
      onError: () => {
        notifications.show({
          message: 'Could not update card.',
        });
      },
      onSettled: () => {
        props.onClose();
      },
    });
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
      title={
        <Stack gap={0}>
          <Text fw={600}>Add or update card</Text>
          <Text c={'gray'} fw={500}>
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
