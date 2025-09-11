import { Menu, ActionIcon } from '@mantine/core';
import { Fragment, useState } from 'react';
import { BsThreeDots, BsPencilFill, BsTrash2Fill } from 'react-icons/bs';
import EditCollectionDrawer from '../editCollectionDrawer/EditCollectionDrawer';
import DeleteCollectionModal from '../deleteCollectionModal/DeleteCollectionModal';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  id: string;
  name: string;
  description?: string;
  authorHandle: string;
}

export default function CollectionActions(props: Props) {
  const { user } = useAuth();
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isAuthor = user?.handle === props.authorHandle;

  return (
    <Fragment>
      <Menu shadow="sm">
        <Menu.Target>
          <ActionIcon variant="light" color={'gray'}>
            <BsThreeDots size={22} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          {isAuthor && (
            <Fragment>
              <Menu.Item
                onClick={() => setShowEditDrawer(true)}
                leftSection={<BsPencilFill />}
              >
                Edit collection
              </Menu.Item>
              <Menu.Item
                color="red"
                leftSection={<BsTrash2Fill />}
                onClick={() => setShowDeleteModal(true)}
              >
                Delete collection
              </Menu.Item>
            </Fragment>
          )}
        </Menu.Dropdown>
      </Menu>
      <EditCollectionDrawer
        isOpen={showEditDrawer}
        onClose={() => setShowEditDrawer(false)}
        collection={{
          id: props.id,
          name: props.name,
          description: props.description,
        }}
      />
      <DeleteCollectionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        collectionId={props.id}
      />
    </Fragment>
  );
}
