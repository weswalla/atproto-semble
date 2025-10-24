import {
  AspectRatio,
  Group,
  Stack,
  Image,
  Text,
  Card,
  Anchor,
  Tooltip,
  Textarea,
  Button,
} from '@mantine/core';
import Link from 'next/link';
import { Dispatch, MouseEvent, SetStateAction, useState } from 'react';
import { UrlCard } from '@/api-client';
import { getDomain } from '@/lib/utils/link';
import { useRouter } from 'next/navigation';

interface Props {
  cardContent: UrlCard['cardContent'];
  note: string;
  onUpdateNote: Dispatch<SetStateAction<string>>;
}

export default function CardToBeAddedPreview(props: Props) {
  const [noteMode, setNoteMode] = useState(false);
  const [note, setNote] = useState(props.note);
  const domain = getDomain(props.cardContent.url);
  const router = useRouter();

  const handleNavigateToSemblePage = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    router.push(`/url?id=${props.cardContent.url}`);
  };

  if (noteMode) {
    return (
      <Card
        withBorder
        component="article"
        p={'xs'}
        radius={'lg'}
        style={{ cursor: 'pointer' }}
      >
        <Stack gap={'xs'}>
          <Textarea
            id="note"
            label="Note"
            placeholder="Add a note about this card"
            variant="filled"
            size="md"
            rows={3}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.currentTarget.value)}
          />
          <Group gap={'xs'} grow>
            <Button
              variant="light"
              color="gray"
              onClick={() => {
                setNoteMode(false);
                setNote(props.note);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                props.onUpdateNote(note);
                setNoteMode(false);
              }}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </Card>
    );
  }

  return (
    <Card
      withBorder
      component="article"
      p={'xs'}
      radius={'lg'}
      style={{ cursor: 'pointer' }}
      onClick={handleNavigateToSemblePage}
    >
      <Stack>
        <Group gap={'sm'} justify="space-between">
          {props.cardContent.thumbnailUrl && (
            <AspectRatio ratio={1 / 1} flex={0.1}>
              <Image
                src={props.cardContent.thumbnailUrl}
                alt={`${props.cardContent.url} social preview image`}
                radius={'md'}
                w={50}
                h={50}
              />
            </AspectRatio>
          )}
          <Stack gap={0} flex={0.9}>
            <Tooltip label={props.cardContent.url}>
              <Anchor
                component={Link}
                href={props.cardContent.url}
                target="_blank"
                c={'gray'}
                lineClamp={1}
                onClick={(e) => e.stopPropagation()}
              >
                {domain}
              </Anchor>
            </Tooltip>
            {props.cardContent.title && (
              <Text fw={500} lineClamp={1}>
                {props.cardContent.title}
              </Text>
            )}
          </Stack>
          <Button
            variant="light"
            color="gray"
            onClick={(e) => {
              e.stopPropagation();
              setNoteMode(true);
            }}
          >
            {props.note ? 'Update note' : 'Add note'}
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
