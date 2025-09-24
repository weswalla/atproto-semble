import { ApiClient } from '@/api-client/ApiClient';
import { getAccessTokenInServerComponent } from '@/services/auth';
import {
  Container,
  Stack,
  Group,
  Avatar,
  Text,
  Title,
  Button,
} from '@mantine/core';
import { FaBluesky } from 'react-icons/fa6';
import ProfileTabs from '../profileTabs/ProfileTabs';
import { truncateText } from '@/lib/utils/text';

interface Props {
  handle: string;
}

export default async function ProfileHeader(props: Props) {
  const accessToken = await getAccessTokenInServerComponent();

  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => accessToken,
  );
  const data = await apiClient.getMyProfile();

  return (
    <Container p={'xs'} size={'xl'}>
      <Stack gap={'xl'}>
        <Group justify="space-between" align="end">
          <Group gap={'lg'} align="end">
            <Avatar
              src={data.avatarUrl}
              alt={`${data.name}'s avatar`}
              size={180}
              radius={'lg'}
            />
            <Stack gap={'sm'}>
              <Stack gap={0}>
                <Title order={1} fz={'h2'}>
                  {data.name}
                </Title>
                <Text c="blue" fw={600} fz={'xl'}>
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
        <ProfileTabs handle={data.handle} />
      </Stack>
    </Container>
  );
}
