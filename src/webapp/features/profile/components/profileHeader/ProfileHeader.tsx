import {
  Container,
  Stack,
  Group,
  Avatar,
  Text,
  Title,
  Button,
} from '@mantine/core';
import { truncateText } from '@/lib/utils/text';
import MinimalProfileHeaderContainer from '../../containers/minimalProfileHeaderContainer/MinimalProfileHeaderContainer';
import { FaBluesky } from 'react-icons/fa6';
import { ApiClient } from '@/api-client/ApiClient';
import { createClientTokenManager } from '@/services/auth';

interface Props {
  handle: string;
}

export default async function ProfileHeader(props: Props) {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    createClientTokenManager(),
  );

  const profile = await apiClient.getProfile({
    did: props.handle,
  });

  return (
    <Container bg={'white'} p={'xs'} size={'xl'}>
      <MinimalProfileHeaderContainer
        avatarUrl={profile.avatarUrl}
        name={profile.name}
        handle={profile.handle}
      />

      <Stack gap={'xl'}>
        <Group justify="space-between" align="end">
          <Group gap={'lg'} align="end">
            <Avatar
              src={profile.avatarUrl}
              alt={`${profile.name}'s avatar`}
              size={'clamp(95px, 14vw, 180px)'}
              radius={'lg'}
            />
            <Stack gap={'sm'}>
              <Stack gap={0}>
                <Title order={1} fz={{ base: 'h2', md: 'h1' }}>
                  {profile.name}
                </Title>
                <Text c="blue" fw={600} fz={{ base: 'lg', md: 'xl' }}>
                  @{profile.handle}
                </Text>
              </Stack>
              {profile.description && <Text>{profile.description}</Text>}
            </Stack>
          </Group>
          <Button
            component="a"
            href={`https://bsky.app/profile/${profile.handle}`}
            target="_blank"
            radius={'xl'}
            bg="gray.2"
            c={'gray'}
            leftSection={<FaBluesky />}
          >
            {truncateText(profile.handle, 14)}
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
