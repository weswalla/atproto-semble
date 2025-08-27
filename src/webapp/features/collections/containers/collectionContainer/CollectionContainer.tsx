'use client';

import {
  ActionIcon,
  Anchor,
  Container,
  Grid,
  Group,
  Menu,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import useCollection from '../../lib/queries/useCollection';
import UrlCard from '@/features/cards/components/urlCard/UrlCard';
import { BsThreeDots } from 'react-icons/bs';
import Link from 'next/link';
import { useState } from 'react';
import EditCollectionDrawer from '../../components/editCollectionDrawer/EditCollectionDrawer';

interface Props {
  id: string;
}

export default function CollectionContainer(props: Props) {
  const { data } = useCollection({ id: props.id });
  const [showEditDrawer, setShowEditDrawer] = useState(false);

  return (
    <Container p={'xs'} size={'xl'}>
      <Stack justify="flex-start">
        <Group justify="space-between" align="start">
          <Stack gap={0}>
            <Text fw={700} c={'grape'}>
              Collection
            </Text>
            <Title order={1} lh={0.8}>
              {data.name}
            </Title>
            {data.description && (
              <Text c={'gray'} mt={'lg'}>
                {data.description}
              </Text>
            )}
          </Stack>

          <Stack>
            <Text fw={600} c={'gray.7'}>
              By{' '}
              <Anchor
                component={Link}
                href={`/profile/${data.author.handle}`}
                fw={700}
                c={'blue'}
              >
                {data.author.name}
              </Anchor>
            </Text>
          </Stack>
        </Group>

        <Group justify="end">
          <Menu shadow="sm">
            <Menu.Target>
              <ActionIcon variant="light" color={'gray'}>
                <BsThreeDots size={22} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => setShowEditDrawer(true)}>
                Edit collection
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Grid gutter={'md'} grow>
          {data.urlCards.map((card) => (
            <Grid.Col
              key={card.id}
              span={{ base: 12, xs: 6, sm: 2, lg: 2, xl: 2 }}
            >
              <UrlCard
                id={card.id}
                url={card.url}
                cardContent={card.cardContent}
                note={card.note}
              />
            </Grid.Col>
          ))}
        </Grid>
      </Stack>
      <EditCollectionDrawer
        isOpen={showEditDrawer}
        onClose={() => setShowEditDrawer(false)}
        collection={{
          id: data.id,
          name: data.name,
          description: data.description,
        }}
      />
    </Container>
  );
}
