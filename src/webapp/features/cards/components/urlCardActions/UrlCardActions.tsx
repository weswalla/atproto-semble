'use client';

import type { UrlCard, Collection } from '@/api-client';
import EditNoteDrawer from '@/features/notes/components/editNoteDrawer/EditNoteDrawer';
import { ActionIcon, Button, Group, Menu } from '@mantine/core';
import { Fragment, useState } from 'react';
import { AiOutlineSignature } from 'react-icons/ai';
import { BiPlus } from 'react-icons/bi';
import { BsThreeDots, BsTrash2Fill } from 'react-icons/bs';
import { LuUnplug } from 'react-icons/lu';
import RemoveCardFromCollectionModal from '../removeCardFromCollectionModal/RemoveCardFromCollectionModal';
import RemoveCardFromLibraryModal from '../removeCardFromLibraryModal/RemoveCardFromLibraryModal';
import AddCardToModal from '@/features/cards/components/addCardToModal/AddCardToModal';
import { MdOutlineStickyNote2 } from 'react-icons/md';
import NoteCardModal from '@/features/notes/components/noteCardModal/NoteCardModal';
import { useAuth } from '@/hooks/useAuth';
import { IoMdCheckmark } from 'react-icons/io';

interface Props {
  id: string;
  cardContent: UrlCard['cardContent'];
  authorHandle?: string;
  note?: UrlCard['note'];
  currentCollection?: Collection;
  urlLibraryCount: number;
  urlIsInLibrary: boolean;
}

export default function UrlCardActions(props: Props) {
  const { user } = useAuth();
  // assume the current user is the card owner if authorHandle isn't passed
  const isAuthor = props.authorHandle
    ? user?.handle === props.authorHandle
    : true;
  const [showEditNoteModal, setShowEditNoteModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showRemoveFromCollectionModal, setShowRemoveFromCollectionModal] =
    useState(false);
  const [showRemoveFromLibaryModal, setShowRemoveFromLibraryModal] =
    useState(false);
  const [showAddToModal, setShowAddToModal] = useState(false);

  return (
    <Fragment>
      <Group
        justify="space-between"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Group gap={'xs'}>
          <Button
            variant="light"
            color={'gray'}
            size="xs"
            radius={'xl'}
            leftSection={
              props.urlIsInLibrary ? (
                <IoMdCheckmark size={18} />
              ) : (
                <BiPlus size={18} />
              )
            }
            onClick={() => {
              setShowAddToModal(true);
            }}
          >
            {props.urlLibraryCount}
          </Button>
          {props.note && (
            <ActionIcon
              variant="light"
              color="gray"
              radius={'xl'}
              onClick={() => {
                setShowNoteModal(true);
              }}
            >
              <MdOutlineStickyNote2 />
            </ActionIcon>
          )}
        </Group>
        {isAuthor && (
          <Menu shadow="sm">
            <Menu.Target>
              <ActionIcon variant="light" color={'gray'} radius={'xl'}>
                <BsThreeDots size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {props.note && (
                <Menu.Item
                  leftSection={<AiOutlineSignature />}
                  onClick={() => {
                    setShowEditNoteModal(true);
                  }}
                >
                  Edit note
                </Menu.Item>
              )}
              {props.currentCollection && (
                <Menu.Item
                  leftSection={<LuUnplug />}
                  onClick={() => {
                    setShowRemoveFromCollectionModal(true);
                  }}
                >
                  Remove from this collection
                </Menu.Item>
              )}
              <Menu.Item
                color="red"
                leftSection={<BsTrash2Fill />}
                onClick={() => {
                  setShowRemoveFromLibraryModal(true);
                }}
              >
                Remove from library
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>

      <AddCardToModal
        isOpen={showAddToModal}
        onClose={() => setShowAddToModal(false)}
        cardContent={props.cardContent}
        cardId={props.id}
      />

      <NoteCardModal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        note={props.note}
        urlCardContent={props.cardContent}
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
