import { UrlCardView } from '@/api-client/types';
import { getDomain } from '@/lib/utils/link';
import {
  Card,
  Image,
  Text,
  Stack,
  Group,
  Anchor,
  AspectRatio,
} from '@mantine/core';
import Link from 'next/link';
import UrlCardActions from '../urlCardActions/UrlCardActions';

interface Props {
  size?: 'large' | 'compact' | 'small';
  id: string;
  url: string;
  cardContent: UrlCardView['cardContent'];
  note?: UrlCardView['note'];
  collections?: UrlCardView['collections'];
  currentCollection?: UrlCardView['collections'][0];
  libraries?: UrlCardView['libraries'];
  authorHandle?: string;
}

export default function UrlCard(props: Props) {
  const domain = getDomain(props.url);
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

          <UrlCardActions
            id={props.id}
            authorHandle={props.authorHandle}
            note={props.note}
            collections={props.collections}
            currentCollection={props.currentCollection}
            libraries={props.libraries}
          />
        </Stack>
      </Card>
    </Stack>
  );
}
