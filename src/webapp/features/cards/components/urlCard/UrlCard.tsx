import type { UrlCard, Collection, User } from '@/api-client';
import { getDomain } from '@/lib/utils/link';
import {
  Card,
  Image,
  Text,
  Stack,
  Group,
  Anchor,
  AspectRatio,
  Tooltip,
} from '@mantine/core';
import Link from 'next/link';
import UrlCardActions from '../urlCardActions/UrlCardActions';
import { MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from './UrlCard.module.css';

interface Props {
  size?: 'large' | 'compact' | 'small';
  id: string;
  url: string;
  cardContent: UrlCard['cardContent'];
  note?: UrlCard['note'];
  currentCollection?: Collection;
  urlLibraryCount: number;
  urlIsInLibrary?: boolean;
  authorHandle?: string;
  cardAuthor?: User;
}

export default function UrlCard(props: Props) {
  const domain = getDomain(props.url);
  const router = useRouter();

  const handleNavigateToSemblePage = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    router.push(`/url?id=${props.cardContent.url}`);
  };
  // TODO: add more sizes

  return (
    <Card
      component="article"
      radius={'lg'}
      p={'sm'}
      flex={1}
      h={'100%'}
      withBorder
      className={styles.root}
      onClick={handleNavigateToSemblePage}
    >
      <Stack justify="space-between" gap={'sm'} flex={1}>
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
              <Text fw={500} lineClamp={2}>
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

        <UrlCardActions
          cardAuthor={props.cardAuthor}
          cardContent={props.cardContent}
          cardCount={props.urlLibraryCount}
          id={props.id}
          authorHandle={props.authorHandle}
          note={props.note}
          currentCollection={props.currentCollection}
          urlLibraryCount={props.urlLibraryCount}
          urlIsInLibrary={props.urlIsInLibrary!!}
        />
      </Stack>
    </Card>
  );
}
