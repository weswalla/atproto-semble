'use client';

import useGetCardFromMyLibrary from '@/features/cards/lib/queries/useGetCardFromMyLibrary';
import { Button, Group } from '@mantine/core';
import { Fragment } from 'react';
import { FiPlus } from 'react-icons/fi';
import { IoMdCheckmark } from 'react-icons/io';

interface Props {
  url: string;
}

export default function SembleActions(props: Props) {
  const cardStatus = useGetCardFromMyLibrary({ url: props.url });
  const isInYourLibrary = cardStatus.data.card?.urlInLibrary;

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
        >
          {isInYourLibrary ? 'In library' : 'Add to library'}
        </Button>
      </Group>
    </Fragment>
  );
}
