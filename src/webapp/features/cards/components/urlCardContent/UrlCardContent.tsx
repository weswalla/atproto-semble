import { getDomain, isCollectionPage } from '@/lib/utils/link';
import {
  Anchor,
  AspectRatio,
  Group,
  Stack,
  Text,
  Image,
  Tooltip,
} from '@mantine/core';
import { UrlCard } from '@semble/types';
import Link from 'next/link';

interface Props {
  url: string;
  cardContent: UrlCard['cardContent'];
}

export default function UrlCardContent(props: Props) {
  const domain = getDomain(props.url);

  // semble collection
  if (isCollectionPage(props.url)) {
    return (
      <Group justify="space-between" align="start" gap={'lg'}>
        <Stack gap={0} flex={1}>
          <Text c={'grape'} fw={500}>
            Collection
          </Text>
          {props.cardContent.title && (
            <Text c={'bright'} lineClamp={2} fw={500} w={'fit-content'}>
              {props.cardContent.title}
            </Text>
          )}
          {props.cardContent.description && (
            <Text c={'gray'} fz={'sm'} mt={'xs'} lineClamp={3}>
              {props.cardContent.description}
            </Text>
          )}
        </Stack>
      </Group>
    );
  }

  return (
    <Group justify="space-between" align="start" gap={'lg'}>
      <Stack gap={0} flex={1}>
        <Tooltip label={props.url}>
          <Anchor
            onClick={(e) => e.stopPropagation()}
            component={Link}
            href={props.url}
            target="_blank"
            c={'gray'}
            lineClamp={1}
            w={'fit-content'}
          >
            {domain}
          </Anchor>
        </Tooltip>
        {props.cardContent.title && (
          <Anchor
            onClick={(e) => e.stopPropagation()}
            component={Link}
            href={props.url}
            target="_blank"
            c={'bright'}
            lineClamp={2}
            fw={500}
            w={'fit-content'}
          >
            {props.cardContent.title}
          </Anchor>
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
  );
}
