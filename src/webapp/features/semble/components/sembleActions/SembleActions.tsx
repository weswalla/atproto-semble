'use client';

import AddCardToModal from '@/features/cards/components/addCardToModal/AddCardToModal';
import useGetCardFromMyLibrary from '@/features/cards/lib/queries/useGetCardFromMyLibrary';
import { Button, Group } from '@mantine/core';
import { Fragment, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { IoMdCheckmark } from 'react-icons/io';

interface Props {
  url: string;
}

export default function SembleActions(props: Props) {
  const cardStatus = useGetCardFromMyLibrary({ url: props.url });
  const isInYourLibrary = cardStatus.data.card?.urlInLibrary;
  const [showAddToModal, setShowAddToModal] = useState(false);

  if (cardStatus.error) {
    return null;
  }

  return (
    <Fragment>
      <Group>
        <Button
          variant={isInYourLibrary ? 'default' : 'filled'}
          size="md"
          leftSection={
            isInYourLibrary ? <IoMdCheckmark size={18} /> : <FiPlus size={18} />
          }
          onClick={() => setShowAddToModal(true)}
        >
          {isInYourLibrary ? 'In library' : 'Add to library'}
        </Button>
      </Group>

      <AddCardToModal
        isOpen={showAddToModal}
        onClose={() => setShowAddToModal(false)}
        url={props.url}
        cardId={cardStatus.data.card?.id}
        note={cardStatus.data.card?.note?.text}
        urlLibraryCount={cardStatus.data.card?.urlLibraryCount}
        isInYourLibrary={cardStatus.data.card?.urlInLibrary}
      />
    </Fragment>
  );
}
