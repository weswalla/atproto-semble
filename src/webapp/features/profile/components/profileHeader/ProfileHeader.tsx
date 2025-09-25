'use client';

import {
  Container,
  Stack,
  Group,
  Avatar,
  Text,
  Title,
  Button,
  Box,
} from '@mantine/core';
import { FaBluesky } from 'react-icons/fa6';
import { truncateText } from '@/lib/utils/text';
import useMyProfile from '../../lib/queries/useMyProfile';
import { useWindowScroll } from '@mantine/hooks';
import MinimalProfileHeader from './MinimalProfileHeader';

// TODO: once we have profile endpoints, we'll use handle to fetch profile data
interface Props {
  handle: string;
}

export default function ProfileHeader(props: Props) {
  const { data } = useMyProfile();
  const [{ y: yScroll }] = useWindowScroll();
  const HEADER_REVEAL_SCROLL_THRESHOLD = 140;

  return (
    <Container bg={'white'} p={'xs'} size={'xl'}>
      <Box
        style={{
          position: 'fixed',
          top: 0,
          width: '100%',
          zIndex: 2,
          transform: `translateY(${yScroll > HEADER_REVEAL_SCROLL_THRESHOLD ? '0' : '-100px'})`,
          transition: 'transform 100ms ease',
          backgroundColor: 'var(--mantine-color-body)',
        }}
      >
        <MinimalProfileHeader
          avatarUrl={data.avatarUrl}
          name={data.name}
          handle={data.handle}
        />
      </Box>

      <Stack gap={'xl'}>
        <Group justify="space-between" align="end">
          <Group gap={'lg'} align="end">
            <Avatar
              src={data.avatarUrl}
              alt={`${data.name}'s avatar`}
              size={'clamp(95px, 14vw, 180px)'}
              radius={'lg'}
            />
            <Stack gap={'sm'}>
              <Stack gap={0}>
                <Title order={1} fz={{ base: 'h2', md: 'h1' }}>
                  {data.name}
                </Title>
                <Text c="blue" fw={600} fz={{ base: 'lg', md: 'xl' }}>
                  @{data.handle}
                </Text>
              </Stack>
              {data.description && <Text>{data.description}</Text>}
            </Stack>
          </Group>
          <Button
            component="a"
            href={`https://bsky.app/profile/${data.handle}`}
            target="_blank"
            radius={'xl'}
            bg="gray.2"
            c={'gray'}
            leftSection={<FaBluesky />}
          >
            {truncateText(data.handle, 14)}
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
