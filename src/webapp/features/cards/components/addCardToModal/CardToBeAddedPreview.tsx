import {
  AspectRatio,
  Group,
  Stack,
  Image,
  Text,
  Card,
  Anchor,
  Tooltip,
} from '@mantine/core';
import Link from 'next/link';
import { MouseEvent } from 'react';
import { UrlCard } from '@/api-client';
import { getDomain } from '@/lib/utils/link';
import { useRouter } from 'next/navigation';

interface Props {
  cardContent: UrlCard['cardContent'];
}

export default function CardToBeAddedPreview(props: Props) {
  const domain = getDomain(props.cardContent.url);
  const router = useRouter();

  const handleNavigateToSemblePage = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    router.push(`/url?id=${props.cardContent.url}`);
  };

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
        <Group gap={'sm'}>
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
        </Group>
      </Stack>
    </Card>
  );
}
