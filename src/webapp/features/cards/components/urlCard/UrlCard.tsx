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
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Link from 'next/link';
import { BiPlus } from 'react-icons/bi';

interface Props {
  size?: 'large' | 'compact' | 'small';
  id: string;
  url: string;
  cardContent: UrlCardView['cardContent'];
  note?: UrlCardView['note'];
  collections?: UrlCardView['collections'];
  libraries?: UrlCardView['libraries'];
}

export default function UrlCard(props: Props) {
  const domain = getDomain(props.url);
  const [modalOpened, { open, close }] = useDisclosure(false);
  // TODO: add more sizes

  return (
    <Stack component="article" gap={5} justify="stretch" h={'100%'}>
      <Card withBorder radius={'lg'} p={'sm'} flex={1}>
        <Stack justify="space-between" gap={'sm'} flex={1}>
          <Group justify="space-between" align="start" wrap="nowrap" gap={'lg'}>
            <Stack gap={0}>
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
              <AspectRatio ratio={1 / 1}>
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
            <ActionIcon
              variant="subtle"
              color={'gray'}
              radius={'xl'}
              onClick={open}
            >
              <BiPlus size={22} />
            </ActionIcon>
          </Group>
        </Stack>
      </Card>
      {props.note && <NoteCard note={props.note.text} />}
      <AddToCollectionModal
        cardId={props.id}
        isOpen={modalOpened}
        onClose={close}
      />
    </Stack>
  );
}
