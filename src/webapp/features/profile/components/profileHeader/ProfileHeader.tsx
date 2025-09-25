import { ApiClient } from '@/api-client/ApiClient';
import { createServerTokenManager } from '@/services/auth';
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

interface Props {
  handle: string;
}

export default async function ProfileHeader(props: Props) {
  const serverTokenManager = await createServerTokenManager();

  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    serverTokenManager,
  );
  const data = await apiClient.getMyProfile();

  return (
    <Container p={'xs'} size={'xl'}>
      <Stack>
        <Group justify="space-between">
          <Group>
            <Avatar
              src={data.avatarUrl}
              alt={`${data.name}'s avatar`}
              size={'xl'}
              radius={'lg'}
            />
            <Stack gap={'sm'}>
              <Group>
                <Title order={1} fz={'h4'}>
                  {data.name}
                </Title>
                <Text c="blue" fw={600} fz={'h4'}>
                  {data.handle}
                </Text>
              </Group>
              {data.description && <Text>{data.description}</Text>}
            </Stack>
          </Group>
          <Button
            component="a"
            href={`https://bsky.app/profile/${data.handle}`}
            target="_blank"
            color="gray"
            leftSection={<FaBluesky size={22} />}
          >
            @{data.handle}
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
