import { UrlCardView } from '@/api-client/types';
import { AddToCollectionModal } from '@/components/AddToCollectionModal';
import NoteCard from '@/features/notes/components/noteCard/NoteCard';
import { getDomain } from '@/lib/utils/link';
import {
  Card,
  Image,
  Text,
  Stack,
  Group,
  ActionIcon,
  Anchor,
  AspectRatio,
  Menu,
} from '@mantine/core';
import Link from 'next/link';
import { useState } from 'react';
import { BiCollection, BiPlus } from 'react-icons/bi';
import { BsThreeDots, BsTrash2Fill } from 'react-icons/bs';
import { LuUnplug } from 'react-icons/lu';
import { AiOutlineSignature } from 'react-icons/ai';
import EditNoteDrawer from '@/features/notes/components/editNoteDrawer/EditNoteDrawer';
import RemoveCardFromLibraryModal from '../removeCardFromLibraryModal/RemoveCardFromLibraryModal';
import RemoveCardFromCollectionModal from '../removeCardFromCollectionModal/RemoveCardFromCollectionModal';

interface Props {
  size?: 'large' | 'compact' | 'small';
  id: string;
  url: string;
  cardContent: UrlCardView['cardContent'];
  note?: UrlCardView['note'];
  collections?: UrlCardView['collections'];
  currentCollection?: UrlCardView['collections'][0];
  libraries?: UrlCardView['libraries'];
}

export default function UrlCard(props: Props) {
  const domain = getDomain(props.url);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditNoteModal, setShowEditNoteModal] = useState(false);
  const [showRemoveFromCollectionModal, setShowRemoveFromCollectionModal] =
    useState(false);
  const [showRemoveFromLibaryModal, setShowRemoveFromLibraryModal] =
    useState(false);
  // TODO: add more sizes

  return (
    <Stack component="article" gap={5} justify="stretch" h={'100%'}>
      <Card withBorder radius={'lg'} p={'sm'} flex={1}>
        <Stack justify="space-between" gap={'sm'} flex={1}>
          <Group justify="space-between" align="start" gap={'lg'}>
            <Stack gap={0} flex={0.9}>
              <Anchor
                component={Link}
                href={props.url}
                target="_blank"
                c={'gray'}
                lineClamp={1}
              >
                {domain}
              </Anchor>
              {props.cardContent.title && (
                <Text fw={500} lineClamp={1}>
                  {props.cardContent.title}
                </Text>
              )}
              {props.cardContent.description && (
                <Text c={'gray'} fz={'sm'} mt={'xs'} lineClamp={3}>
                  {props.cardContent.description}
                </Text>
              )}
            </Stack>
            {props.cardContent.thumbnailUrl && (
              <AspectRatio ratio={1 / 1} flex={0.1}>
                <Image
                  src={props.cardContent.thumbnailUrl}
                  alt={`${props.url} social preview image`}
                  radius={'md'}
                  w={75}
                  h={75}
                />
              </AspectRatio>
            )}
          </Group>
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
        </Stack>
      </Card>
      {props.note && <NoteCard note={props.note.text} />}
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
    </Stack>
  );
}
