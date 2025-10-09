import {
  AspectRatio,
  Group,
  Stack,
  Image,
  Text,
  Card,
  Menu,
  Button,
  ScrollArea,
  Anchor,
} from '@mantine/core';
import Link from 'next/link';
import { GetCollectionsResponse, UrlCardView } from '@/api-client/types';
import { BiCollection } from 'react-icons/bi';
import { LuLibrary } from 'react-icons/lu';
import { getDomain } from '@/lib/utils/link';
import useMyProfile from '@/features/profile/lib/queries/useMyProfile';
import { getRecordKey } from '@/lib/utils/atproto';

interface Props {
  cardId: string;
  cardContent: UrlCardView['cardContent'];
  collectionsWithCard: GetCollectionsResponse['collections'];
  isInLibrary: boolean;
}

export default function CardToBeAddedPreview(props: Props) {
  const domain = getDomain(props.cardContent.url);
  const { data: profile } = useMyProfile();

  return (
    <Stack gap={'xs'}>
      <Card withBorder p={'xs'} radius={'lg'}>
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
              <Anchor
                component={Link}
                href={props.cardContent.url}
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
            </Stack>
          </Group>
        </Stack>
      </Card>

      <Group>
        {props.isInLibrary && (
          <Button
            variant="light"
            color="green"
            component={Link}
            href={`/profile/${profile.handle}/cards/${props.cardId}`}
            target="_blank"
            leftSection={<LuLibrary size={22} />}
          >
            In Library
          </Button>
        )}
        {props.collectionsWithCard.length > 0 && (
          <Menu shadow="sm">
            <Menu.Target>
              <Button
                variant="light"
                color="grape"
                leftSection={<BiCollection size={22} />}
              >
                In {props.collectionsWithCard.length} Collection
                {props.collectionsWithCard.length !== 1 && 's'}
              </Button>
            </Menu.Target>
            <Menu.Dropdown maw={380}>
              <ScrollArea.Autosize mah={150} type="auto">
                {props.collectionsWithCard.map((c) => (
                  <Menu.Item
                    key={c.id}
                    component={Link}
                    href={`/profile/${c.createdBy.handle}/collections/${getRecordKey(c.uri!)}`}
                    target="_blank"
                    c="blue"
                    fw={600}
                  >
                    {c.name}
                  </Menu.Item>
                ))}
              </ScrollArea.Autosize>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    </Stack>
  );
}
