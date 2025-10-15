import type { UrlCardView } from '@/api-client/types';
import { getDomain } from '@/lib/utils/link';
import { UPDATE_OVERLAY_PROPS } from '@/styles/overlays';
import {
  Anchor,
  AspectRatio,
  Card,
  Group,
  Modal,
  Stack,
  Text,
  Image,
  Tooltip,
} from '@mantine/core';
import Link from 'next/link';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  note: UrlCardView['note'];
  urlCardContent: UrlCardView['cardContent'];
}

export default function NoteCardModal(props: Props) {
  const domain = getDomain(props.urlCardContent.url);

  return (
    <Modal
      opened={props.isOpen}
      onClose={props.onClose}
      title="Note"
      overlayProps={UPDATE_OVERLAY_PROPS}
      centered
    >
      <Stack gap={'xl'}>
        {props.note && <Text>{props.note.text}</Text>}
        <Card withBorder p={'xs'} radius={'lg'}>
          <Stack>
            <Group gap={'sm'}>
              {props.urlCardContent.thumbnailUrl && (
                <AspectRatio ratio={1 / 1} flex={0.1}>
                  <Image
                    src={props.urlCardContent.thumbnailUrl}
                    alt={`${props.urlCardContent.url} social preview image`}
                    radius={'md'}
                    w={50}
                    h={50}
                  />
                </AspectRatio>
              )}
              <Stack gap={0} flex={0.9}>
                <Tooltip label={props.urlCardContent.url}>
                  <Anchor
                    component={Link}
                    href={props.urlCardContent.url}
                    target="_blank"
                    c={'gray'}
                    lineClamp={1}
                  >
                    {domain}
                  </Anchor>
                </Tooltip>
                {props.urlCardContent.title && (
                  <Text fw={500} lineClamp={1}>
                    {props.urlCardContent.title}
                  </Text>
                )}
              </Stack>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </Modal>
  );
}
