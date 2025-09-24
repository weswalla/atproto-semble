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
import { GetMyCollectionsResponse, UrlCardView } from '@/api-client/types';
import Link from 'next/link';
import { getDomain } from '@/lib/utils/link';
import { BiSolidChevronDownCircle } from 'react-icons/bi';

interface Props {
  cardContent: UrlCardView['cardContent'];
  collectionsWithCard: GetMyCollectionsResponse['collections'];
}

export default function CardToBeAddedPreview(props: Props) {
  const domain = getDomain(props.cardContent.url);

  return (
    <Stack gap={'md'}>
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
          {props.collectionsWithCard.length > 0 && (
            <Menu shadow="sm">
              <Menu.Target>
                <Button
                  variant="light"
                  color="grape"
                  rightSection={<BiSolidChevronDownCircle />}
                >
                  Already in {props.collectionsWithCard.length} collection
                  {props.collectionsWithCard.length !== 1 && 's'}
                </Button>
              </Menu.Target>
              <Menu.Dropdown maw={380}>
                <ScrollArea.Autosize mah={150} type="auto">
                  {props.collectionsWithCard.map((c) => (
                    <Menu.Item
                      key={c.id}
                      component={Link}
                      href={`/profile/${c.createdBy.handle}/collections/${c.id}`}
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
        </Stack>
      </Card>
    </Stack>
  );
}
