'use client';

import { UrlCardView } from '@/api-client/types';
import EditNoteDrawer from '@/features/notes/components/editNoteDrawer/EditNoteDrawer';
import { ActionIcon, Group, Menu } from '@mantine/core';
import { Fragment, useState } from 'react';
import { AiOutlineSignature } from 'react-icons/ai';
import { BiPlus } from 'react-icons/bi';
import { BsThreeDots, BsTrash2Fill } from 'react-icons/bs';
import { LuUnplug } from 'react-icons/lu';
import RemoveCardFromCollectionModal from '../removeCardFromCollectionModal/RemoveCardFromCollectionModal';
import RemoveCardFromLibraryModal from '../removeCardFromLibraryModal/RemoveCardFromLibraryModal';
import AddCardToModal from '@/features/collections/components/addCardToModal/AddCardToModal';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  id: string;
  cardContent: UrlCardView['cardContent'];
  authorHandle?: string;
  note?: UrlCardView['note'];
  currentCollection?: UrlCardView['collections'][0];
  libraries?: UrlCardView['libraries'];
}

export default function UrlCardActions(props: Props) {
  const { user } = useAuth();
  // assume the current user is the card owner if authorHandle isn't passed
  const isAuthor = props.authorHandle
    ? user?.handle === props.authorHandle
    : true;
  const [showEditNoteModal, setShowEditNoteModal] = useState(false);
  const [showRemoveFromCollectionModal, setShowRemoveFromCollectionModal] =
    useState(false);
  const [showRemoveFromLibaryModal, setShowRemoveFromLibraryModal] =
    useState(false);
  const [showAddToLibraryModal, setShowAddToLibraryModal] = useState(false);

  return (
    <Fragment>
      <Group justify="space-between">
        <Group gap={'xs'}>
          <ActionIcon
            variant="subtle"
            color={'gray'}
            radius={'xl'}
            onClick={() => setShowAddToLibraryModal(true)}
          >
            <BiPlus size={22} />
          </ActionIcon>
          {isAuthor && props.note && (
            <ActionIcon
              variant="subtle"
              color="gray"
              radius={'xl'}
              onClick={() => setShowEditNoteModal(true)}
            >
              <AiOutlineSignature size={22} />
            </ActionIcon>
          )}
        </Group>
        {isAuthor && (
          <Menu shadow="sm">
            <Menu.Target>
              <ActionIcon variant="subtle" color={'gray'}>
                <BsThreeDots size={22} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {props.currentCollection && (
                <Menu.Item
                  leftSection={<LuUnplug />}
                  onClick={() => setShowRemoveFromCollectionModal(true)}
                >
                  Remove from this collection
                </Menu.Item>
              )}
              <Menu.Item
                color="red"
                leftSection={<BsTrash2Fill />}
                onClick={() => setShowRemoveFromLibraryModal(true)}
              >
                Remove from library
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>

      <AddCardToModal
        isOpen={showAddToLibraryModal}
        onClose={() => setShowAddToLibraryModal(false)}
        cardContent={props.cardContent}
        cardId={props.id}
      />

      {props.note && (
        <EditNoteDrawer
          isOpen={showEditNoteModal}
          onClose={() => setShowEditNoteModal(false)}
          noteCardId={props.note.id}
          note={props.note.text}
        />
      )}
      {props.currentCollection && (
        <RemoveCardFromCollectionModal
          isOpen={showRemoveFromCollectionModal}
          onClose={() => setShowRemoveFromCollectionModal(false)}
          cardId={props.id}
          collectionId={props.currentCollection.id}
        />
      )}
      <RemoveCardFromLibraryModal
        isOpen={showRemoveFromLibaryModal}
        onClose={() => setShowRemoveFromLibraryModal(false)}
        cardId={props.id}
      />
    </Fragment>
  );
}
