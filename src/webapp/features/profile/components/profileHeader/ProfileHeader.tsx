import {
  Container,
  Stack,
  Group,
  Avatar,
  Text,
  Title,
  Button,
  Spoiler,
  Grid,
  GridCol,
} from '@mantine/core';
import { truncateText } from '@/lib/utils/text';
import MinimalProfileHeaderContainer from '../../containers/minimalProfileHeaderContainer/MinimalProfileHeaderContainer';
import { FaBluesky } from 'react-icons/fa6';
import { ApiClient } from '@/api-client/ApiClient';

interface Props {
  handle: string;
}

export default async function ProfileHeader(props: Props) {
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000',
  );

  const profile = await apiClient.getProfile({
    identifier: props.handle,
  });

  return (
    <Container bg={'white'} p={'xs'} size={'xl'}>
      <MinimalProfileHeaderContainer
        avatarUrl={profile.avatarUrl}
        name={profile.name}
        handle={profile.handle}
      />
      <Stack gap={'sm'}>
        <Stack gap={'xl'}>
          <Grid gutter={'md'} align={'center'} grow>
            <GridCol span={'auto'}>
              <Avatar
                src={profile.avatarUrl}
                alt={`${profile.name}'s avatar`}
                size={'clamp(100px, 22vw, 140px)'}
                radius={'lg'}
              />
            </GridCol>

            <GridCol span={{ base: 12, xs: 9 }}>
              <Stack gap={'sm'}>
                <Stack gap={0}>
                  <Title order={1} fz={{ base: 'h2', md: 'h1' }}>
                    {profile.name}
                  </Title>
                  <Text c="blue" fw={600} fz={{ base: 'lg', md: 'xl' }}>
                    @{profile.handle}
                  </Text>
                </Stack>
                {profile.description && (
                  <Spoiler
                    showLabel={'Read more'}
                    hideLabel={'See less'}
                    maxHeight={45}
                  >
                    <Text>{profile.description}</Text>
                  </Spoiler>
                )}
              </Stack>
            </GridCol>
          </Grid>
        </Stack>
        <Group>
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
