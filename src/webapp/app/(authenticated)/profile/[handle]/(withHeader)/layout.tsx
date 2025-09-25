import { ApiClient } from '@/api-client/ApiClient';
import Header from '@/components/navigation/header/Header';
import ProfileHeader from '@/features/profile/components/profileHeader/ProfileHeader';
import ProfileTabs from '@/features/profile/components/profileTabs/ProfileTabs';
import { getAccessTokenInServerComponent } from '@/services/auth';
import { Box, Button, Container, Stack, Title } from '@mantine/core';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Fragment } from 'react';

interface Props {
  params: Promise<{ handle: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;

  return {
    title: handle,
    description: 'Profile',
  };
}

export default async function Layout(props: Props) {
  const { handle } = await props.params;
  const accessToken = await getAccessTokenInServerComponent();
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    () => accessToken,
  );
  const data = await apiClient.getMyProfile();

  // TODO: use profile endpoints to fetch profile information
  // for now we'll use getMyProfile
  if (!accessToken || data.handle !== handle) {
    return (
      <Fragment>
        <Header />
        <Container p="xs" size="md">
          <Stack align="center">
            <Title order={1}>Public profiles are coming soon!</Title>
            <Button component={Link} href={`/profile/${data.handle}`} fw={600}>
              Visit your own profile
            </Button>
          </Stack>
        </Container>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <Header />
      <ProfileHeader handle={handle} />
      <Box
        style={{
          position: 'sticky',
          top: 59,
          zIndex: 101,
        }}
      >
        <Container bg={'white'} px={'xs'} size={'xl'}>
          <ProfileTabs handle={data.handle} />
        </Container>
      </Box>
      {props.children}
    </Fragment>
  );
}
