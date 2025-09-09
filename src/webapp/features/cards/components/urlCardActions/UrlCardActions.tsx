'use client';

import { UrlCardView } from '@/api-client/types';
import { AddToCollectionModal } from '@/components/AddToCollectionModal';
import EditNoteDrawer from '@/features/notes/components/editNoteDrawer/EditNoteDrawer';
import { ActionIcon, Group, Menu } from '@mantine/core';
import { Fragment, useState } from 'react';
import { AiOutlineSignature } from 'react-icons/ai';
import { BiPlus } from 'react-icons/bi';
import { BsThreeDots, BsTrash2Fill } from 'react-icons/bs';
import { LuUnplug } from 'react-icons/lu';
import RemoveCardFromCollectionModal from '../removeCardFromCollectionModal/RemoveCardFromCollectionModal';
import RemoveCardFromLibraryModal from '../removeCardFromLibraryModal/RemoveCardFromLibraryModal';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  id: string;
  authorHandle?: string;
  note?: UrlCardView['note'];
  collections?: UrlCardView['collections'];
  currentCollection?: UrlCardView['collections'][0];
  libraries?: UrlCardView['libraries'];
}

export default function UrlCardActions(props: Props) {
  const { user } = useAuth();
  const isAuthor = user?.handle === props.authorHandle;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditNoteModal, setShowEditNoteModal] = useState(false);
  const [showRemoveFromCollectionModal, setShowRemoveFromCollectionModal] =
    useState(false);
  const [showRemoveFromLibaryModal, setShowRemoveFromLibraryModal] =
    useState(false);

  return (
    <Fragment>
      <Group justify="space-between">
        <Group gap={'xs'}>
          <ActionIcon
            variant="subtle"
            color={'gray'}
            radius={'xl'}
            onClick={() => setShowAddModal(true)}
          >
            <BiPlus size={22} />
          </ActionIcon>
          {props.note && (
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
        <Menu shadow="sm">
          <Menu.Target>
            <ActionIcon variant="subtle" color={'gray'}>
              <BsThreeDots size={22} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            {/*<Menu.Item
                      leftSection={<BiCollection />}
                    >
                      Edit collections
                    </Menu.Item>*/}
            {props.currentCollection && (
              <Menu.Item
                leftSection={<LuUnplug />}
                onClick={() => setShowRemoveFromCollectionModal(true)}
              >
                {/* TODO: hide if current user !== card author */}
                Remove from this collection
              </Menu.Item>
            )}
            <Menu.Item
              color="red"
              leftSection={<BsTrash2Fill />}
              onClick={() => setShowRemoveFromLibraryModal(true)}
            >
              {/* TODO: hide if current user !== card author */}
              Remove from library
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <AddToCollectionModal
        cardId={props.id}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
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
